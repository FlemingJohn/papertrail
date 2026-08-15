import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import type { IndexedBlock } from "../sections";
import { runAgent } from "../../agents/run-agent";
import { methodWriter } from "../../agents/definitions/method-writer";
import { methodChecker } from "../../agents/definitions/method-checker";
import { announceStage, buildEventWriter, reportActivity } from "../writer";
import { describeIndexedBlocks } from "../context";
import { kindsForMethods, selectKinds, splitIntoSections } from "../sections";

export async function checkMethods(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "checking-methods");

  if (state.document === null) {
    return {};
  }

  const indexed = splitIntoSections(state.document.textBlocks);
  const methodEntries = selectKinds(indexed, kindsForMethods);
  const methodBlocks = methodEntries.length > 0
    ? methodEntries
    : selectMethodBlocks(indexed);

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
      describeIndexedBlocks(methodBlocks).text,
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
      describeIndexedBlocks(methodBlocks).text,
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

function selectMethodBlocks(indexed: IndexedBlock[]): IndexedBlock[] {
  return indexed.filter((entry) =>
    /(we (used|performed|measured|treated|trained|randomi[sz]ed)|were (incubated|assigned|measured|trained))/i.test(
      entry.block.text
    )
  );
}
