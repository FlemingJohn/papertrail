import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import { runAgent } from "../../agents/run-agent";
import { methodWriter } from "../../agents/definitions/method-writer";
import { methodChecker } from "../../agents/definitions/method-checker";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeBlocks } from "../context";

export async function checkMethods(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "checking-methods");

  if (state.document === null) {
    return {};
  }

  const methodBlocks = selectMethodBlocks(state.document.textBlocks);

  if (methodBlocks.length === 0) {
    reportActivity(
      writer,
      "warning",
      "No methods section found",
      "Repeatability could not be assessed."
    );
    return {
      limitations: [
        {
          area: "Methods",
          description:
            "No methods section could be located in the PDF, so missing detail was not assessed.",
        },
      ],
    };
  }

  const protocolOutcome = await runAgent(methodWriter, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      `Paper title: ${state.paperTitle}`,
      "",
      "Methods text:",
      describeBlocks(methodBlocks),
    ].join("\n"),
    writer,
  });

  if (!protocolOutcome.successful) {
    reportActivity(
      writer,
      "warning",
      "Could not draft the protocol",
      protocolOutcome.failure.message
    );
    return {
      limitations: [
        {
          area: "Methods",
          description:
            "The method could not be rewritten as a protocol, so missing detail was not assessed.",
        },
      ],
    };
  }

  const protocol = protocolOutcome.value.output;

  const gapsOutcome = await runAgent(methodChecker, {
    runIdentifier: state.runIdentifier,
    subject: state.paperTitle,
    userPrompt: [
      "Methods text:",
      describeBlocks(methodBlocks),
      "",
      "Protocol drafted from it:",
      JSON.stringify(protocol, null, 2),
    ].join("\n"),
    writer,
  });

  const missingDetails = gapsOutcome.successful
    ? gapsOutcome.value.output.missingDetails
    : [];

  const criticalCount = missingDetails.filter(
    (detail) => detail.severity === "critical"
  ).length;

  reportActivity(
    writer,
    criticalCount === 0 ? "success" : "warning",
    `Found ${missingDetails.length} missing method details`,
    `${criticalCount} of them critical`
  );

  return {
    methodProtocol: protocol,
    missingDetails,
    tokensIn:
      protocolOutcome.value.tokensIn +
      (gapsOutcome.successful ? gapsOutcome.value.tokensIn : 0),
    tokensOut:
      protocolOutcome.value.tokensOut +
      (gapsOutcome.successful ? gapsOutcome.value.tokensOut : 0),
  };
}

function selectMethodBlocks(
  blocks: NonNullable<RunState["document"]>["textBlocks"]
): NonNullable<RunState["document"]>["textBlocks"] {
  const startIndex = blocks.findIndex(
    (block) =>
      block.role === "sectionHeading" &&
      /^(methods?|materials and methods|experimental|methodology)/i.test(
        block.text.trim()
      )
  );

  if (startIndex === -1) {
    return blocks.filter((block) =>
      /\b(we (used|performed|measured|treated|randomi[sz]ed)|were (incubated|assigned|measured))\b/i.test(
        block.text
      )
    );
  }

  const selected: typeof blocks = [];

  for (let index = startIndex + 1; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (
      block.role === "sectionHeading" &&
      /^(results?|discussion|conclusion)/i.test(block.text.trim())
    ) {
      break;
    }

    selected.push(block);
  }

  return selected;
}
