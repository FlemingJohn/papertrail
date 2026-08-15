import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import { readDocument } from "../../tools/azure/read-document";
import { announceStage, buildEventWriter, reportActivity } from "../writer";

export async function readPaper(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "reading-paper");

  const outcome = await readDocument.run(
    { base64Source: state.base64Source },
    {
      runIdentifier: state.runIdentifier,
      nodeName: "read-paper",
      agentName: null,
    }
  );

  if (!outcome.successful) {
    throw new Error(`The PDF could not be read: ${outcome.failure.message}`);
  }

  const document = outcome.value;

  reportActivity(
    writer,
    "success",
    `Read ${document.pageCount} pages`,
    `${document.textBlocks.length} paragraphs, ${document.tables.length} tables, ${document.references.length} references`
  );

  if (document.references.length === 0) {
    reportActivity(
      writer,
      "warning",
      "No reference list found",
      "Citation checking will be limited to what appears in the body text."
    );
  }

  return {
    document,
    documentPagesRead: document.pageCount,
    limitations:
      document.references.length === 0
        ? [
            {
              area: "References",
              description:
                "No reference list could be located in the PDF, so citations were not checked against sources.",
            },
          ]
        : [],
  };
}
