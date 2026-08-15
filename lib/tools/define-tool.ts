import type { z } from "zod";
import type {
  RegisteredTool,
  ToolContext,
  ToolDefinition,
} from "../types/tool";
import { fail, succeed, type FailureCode, type Outcome } from "../types/failure";
import { buildCacheKey, readFromCache, writeToCache } from "./cache";
import { withRetry, withTimeout } from "./retry";
import { recordToolCall } from "./tool-log";

const defaultTimeoutMilliseconds = 20000;

const defaultRetryAttempts = 2;

export function defineTool<
  InputSchema extends z.ZodType,
  OutputSchema extends z.ZodType,
>(
  definition: ToolDefinition<InputSchema, OutputSchema>
): RegisteredTool<InputSchema, OutputSchema> {
  const cacheSeconds = definition.cacheSeconds ?? 0;
  const timeoutMilliseconds =
    definition.timeoutMilliseconds ?? defaultTimeoutMilliseconds;
  const retryAttempts = definition.retryAttempts ?? defaultRetryAttempts;
  const availableToAgents = definition.availableToAgents ?? false;

  async function run(
    rawInput: z.infer<InputSchema>,
    context: ToolContext
  ): Promise<Outcome<z.infer<OutputSchema>>> {
    const parsedInput = definition.inputSchema.safeParse(rawInput);

    if (!parsedInput.success) {
      return fail(
        "invalid-input",
        `${definition.name} received an unexpected input: ${formatIssues(parsedInput.error)}`,
        false
      );
    }

    const cacheKey = buildCacheKey(definition.name, parsedInput.data);
    const cachedValue = readFromCache<z.infer<OutputSchema>>(
      cacheKey,
      cacheSeconds
    );

    if (cachedValue !== null) {
      await recordToolCall({
        runIdentifier: context.runIdentifier,
        nodeName: context.nodeName,
        agentName: context.agentName,
        toolName: definition.name,
        inputFingerprint: cacheKey,
        status: "cache-hit",
        latencyMilliseconds: 0,
        servedFromCache: true,
      });
      return succeed(cachedValue);
    }

    const startedAt = Date.now();

    try {
      const rawOutput = await withRetry(
        () =>
          withTimeout(
            definition.execute(parsedInput.data, context),
            timeoutMilliseconds
          ),
        retryAttempts
      );

      const parsedOutput = definition.outputSchema.safeParse(rawOutput);

      if (!parsedOutput.success) {
        await recordToolCall({
          runIdentifier: context.runIdentifier,
          nodeName: context.nodeName,
          agentName: context.agentName,
          toolName: definition.name,
          inputFingerprint: cacheKey,
          status: "invalid-output",
          latencyMilliseconds: Date.now() - startedAt,
          servedFromCache: false,
        });
        return fail(
          "upstream-error",
          `${definition.name} returned an unexpected shape: ${formatIssues(parsedOutput.error)}`
        );
      }

      writeToCache(cacheKey, parsedOutput.data, cacheSeconds);

      await recordToolCall({
        runIdentifier: context.runIdentifier,
        nodeName: context.nodeName,
        agentName: context.agentName,
        toolName: definition.name,
        inputFingerprint: cacheKey,
        status: "succeeded",
        latencyMilliseconds: Date.now() - startedAt,
        servedFromCache: false,
      });

      return succeed(parsedOutput.data);
    } catch (error) {
      const code = classifyError(error);

      await recordToolCall({
        runIdentifier: context.runIdentifier,
        nodeName: context.nodeName,
        agentName: context.agentName,
        toolName: definition.name,
        inputFingerprint: cacheKey,
        status: code,
        latencyMilliseconds: Date.now() - startedAt,
        servedFromCache: false,
      });

      return fail(
        code,
        error instanceof Error ? error.message : String(error),
        true,
        error
      );
    }
  }

  return {
    name: definition.name,
    description: definition.description,
    inputSchema: definition.inputSchema,
    outputSchema: definition.outputSchema,
    availableToAgents,
    run,
  };
}

function classifyError(error: unknown): FailureCode {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timed out")) {
    return "timed-out";
  }
  if (message.includes("429") || message.includes("rate limit")) {
    return "rate-limited";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "not-found";
  }
  if (message.includes("401") || message.includes("403")) {
    return "behind-paywall";
  }

  return "upstream-error";
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")} ${issue.message}`)
    .join("; ");
}
