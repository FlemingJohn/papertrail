import { z } from "zod";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { AgentDefinition, AgentResult, AgentRunOptions } from "../types/agent";
import { fail, succeed, type Outcome } from "../types/failure";
import { estimateTokenCount, getModel } from "./model";
import { toStrictJsonSchema } from "./json-schema";
import { ThinkingExtractor } from "./thinking-extractor";
import { buildLangChainTools } from "./tool-binding";
import { getToolLabel } from "../tools/registry";
import { recordUsage } from "./usage-log";

const maximumToolRounds = 6;

export async function runAgent<OutputSchema extends z.ZodType>(
  definition: AgentDefinition<OutputSchema>,
  options: AgentRunOptions
): Promise<Outcome<AgentResult<z.infer<OutputSchema>>>> {
  const startedAt = Date.now();
  const writer = options.writer;

  writer?.emit({
    type: "agent-started",
    agentName: definition.name,
    agentLabel: definition.label,
    subject: options.subject,
    stage: definition.stage,
  });

  const wrappedSchema = z.object({
    thinking: z.string(),
    result: definition.outputSchema,
  });

  const messages: BaseMessage[] = [
    new SystemMessage(definition.buildSystemPrompt()),
    new HumanMessage(options.userPrompt),
  ];

  let tokensIn = estimateTokenCount(
    definition.buildSystemPrompt() + options.userPrompt
  );
  let tokensOut = 0;

  if (definition.toolNames.length > 0) {
    const toolOutcome = await gatherToolEvidence(
      definition,
      options,
      messages,
      (added) => {
        tokensIn += added;
      }
    );

    if (!toolOutcome.successful) {
      return toolOutcome;
    }
  }

  for (let attempt = 0; attempt <= definition.maximumRetries; attempt += 1) {
    const attemptOutcome = await requestStructuredAnswer(
      definition,
      options,
      messages,
      wrappedSchema
    );

    if (attemptOutcome.successful) {
      tokensOut += attemptOutcome.value.tokensOut;

      writer?.emit({
        type: "agent-finished",
        agentName: definition.name,
        agentLabel: definition.label,
        subject: options.subject,
        conclusion: attemptOutcome.value.thinking,
        level: "success",
        durationMilliseconds: Date.now() - startedAt,
      });

      return succeed({
        output: attemptOutcome.value.result as z.infer<OutputSchema>,
        tokensIn,
        tokensOut,
        cachedTokensIn: attemptOutcome.value.cachedTokensIn,
        durationMilliseconds: Date.now() - startedAt,
      });
    }

    if (attempt === definition.maximumRetries) {
      writer?.emit({
        type: "agent-finished",
        agentName: definition.name,
        agentLabel: definition.label,
        subject: options.subject,
        conclusion: attemptOutcome.failure.message,
        level: "problem",
        durationMilliseconds: Date.now() - startedAt,
      });
      return attemptOutcome;
    }

    messages.push(
      new HumanMessage(
        `Your previous answer could not be used: ${attemptOutcome.failure.message}. Return valid JSON matching the required shape exactly.`
      )
    );
  }

  return fail("invalid-model-output", `${definition.label} produced no usable answer.`);
}

async function gatherToolEvidence<OutputSchema extends z.ZodType>(
  definition: AgentDefinition<OutputSchema>,
  options: AgentRunOptions,
  messages: BaseMessage[],
  addTokens: (count: number) => void
): Promise<Outcome<true>> {
  let boundModel;

  try {
    const tools = buildLangChainTools(definition.toolNames, {
      runIdentifier: options.runIdentifier,
      nodeName: definition.stage,
      agentName: definition.name,
    });
    boundModel = getModel(definition.temperature).bindTools(tools);
  } catch (error) {
    return fail(
      "configuration-error",
      error instanceof Error ? error.message : String(error),
      false
    );
  }

  const toolsByName = new Map(
    buildLangChainTools(definition.toolNames, {
      runIdentifier: options.runIdentifier,
      nodeName: definition.stage,
      agentName: definition.name,
    }).map((entry) => [entry.name, entry])
  );

  for (let round = 0; round < maximumToolRounds; round += 1) {
    let response: AIMessage;

    try {
      response = (await boundModel.invoke(messages)) as AIMessage;
    } catch (error) {
      return fail(
        "upstream-error",
        error instanceof Error ? error.message : String(error)
      );
    }

    messages.push(response);
    addTokens(estimateTokenCount(String(response.content)));

    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return succeed(true);
    }

    for (const toolCall of toolCalls) {
      const selectedTool = toolsByName.get(toolCall.name);

      if (selectedTool === undefined) {
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? toolCall.name,
            content: JSON.stringify({
              toolFailed: true,
              message: `No tool named ${toolCall.name} is available.`,
            }),
          })
        );
        continue;
      }

      let toolOutput: string;

      try {
        toolOutput = String(await selectedTool.invoke(toolCall.args));
      } catch (error) {
        toolOutput = JSON.stringify({
          toolFailed: true,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      options.writer?.emit({
        type: "tool-used",
        toolName: toolCall.name,
        toolLabel: getToolLabel(toolCall.name),
        agentName: definition.name,
        status: toolOutput.includes('"toolFailed":true') ? "failed" : "succeeded",
        servedFromCache: false,
      });

      addTokens(estimateTokenCount(toolOutput));

      messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? toolCall.name,
          content: toolOutput,
        })
      );
    }
  }

  return succeed(true);
}

async function requestStructuredAnswer<OutputSchema extends z.ZodType>(
  definition: AgentDefinition<OutputSchema>,
  options: AgentRunOptions,
  messages: BaseMessage[],
  wrappedSchema: z.ZodType
): Promise<
  Outcome<{
    thinking: string;
    result: unknown;
    tokensOut: number;
    cachedTokensIn: number;
  }>
> {
  const extractor = new ThinkingExtractor();
  let rawAnswer = "";
  let measuredIn = 0;
  let measuredOut = 0;
  let measuredCached = 0;

  try {
    const stream = await getModel(definition.temperature).stream(messages, {
      response_format: {
        type: "json_schema",
        json_schema: {
          name: definition.name.replace(/-/g, "_"),
          strict: true,
          schema: toStrictJsonSchema(wrappedSchema),
        },
      },
    });

    for await (const chunk of stream) {
      const usage = chunk.usage_metadata;

      if (usage !== undefined) {
        measuredIn += usage.input_tokens ?? 0;
        measuredOut += usage.output_tokens ?? 0;
        measuredCached += usage.input_token_details?.cache_read ?? 0;
      }

      const text = typeof chunk.content === "string" ? chunk.content : "";

      if (text.length === 0) {
        continue;
      }

      rawAnswer += text;

      const thinkingDelta = extractor.consume(text);

      if (thinkingDelta.length > 0) {
        options.writer?.emit({
          type: "agent-thinking",
          agentName: definition.name,
          subject: options.subject,
          text: thinkingDelta,
        });
      }
    }
  } catch (error) {
    return fail(
      "upstream-error",
      error instanceof Error ? error.message : String(error)
    );
  }

  if (rawAnswer.trim().length === 0) {
    return fail("model-refused", `${definition.label} returned an empty answer.`);
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawAnswer);
  } catch {
    return fail("invalid-model-output", "The answer was not valid JSON.");
  }

  const validated = wrappedSchema.safeParse(parsedJson);

  if (!validated.success) {
    return fail(
      "invalid-model-output",
      validated.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")
    );
  }

  const value = validated.data as { thinking: string; result: unknown };

  recordUsage(
    options.runIdentifier,
    measuredIn,
    measuredOut,
    measuredCached
  );

  return succeed({
    thinking: value.thinking,
    result: value.result,
    tokensOut: measuredOut > 0 ? measuredOut : estimateTokenCount(rawAnswer),
    cachedTokensIn: measuredCached,
  });
}
