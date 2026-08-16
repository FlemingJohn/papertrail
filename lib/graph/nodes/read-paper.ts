import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { RunState, RunStateUpdate } from "../state";
import { readDocument } from "../../tools/azure/read-document";
import type { TextBlock } from "../../schemas/document";
import { announceStage, buildEventWriter, reportActivity } from "../writer";

const minimumTitleLength = 8;

const maximumTitleLength = 300;

function readTitle(blocks: TextBlock[]): string | null {
  const titleBlock = blocks.find((block) => block.role === "title");

  if (titleBlock !== undefined) {
    const text = titleBlock.text.trim();
    if (text.length >= minimumTitleLength) {
      return text.slice(0, maximumTitleLength);
    }
  }

  const firstOnPageOne = blocks.find(
    (block) =>
      block.location.pageNumber === 1 &&
      block.role === null &&
      block.text.trim().length >= minimumTitleLength &&
      block.text.trim().length <= maximumTitleLength
  );

  return firstOnPageOne === undefined ? null : firstOnPageOne.text.trim();
}

export async function readPaper(
  state: RunState,
  config: LangGraphRunnableConfig
): Promise<RunStateUpdate> {
  const writer = buildEventWriter(config);
  announceStage(writer, "reading-paper");

  if (state.document !== null) {
    reportActivity(
      writer,
      "success",
      `Reusing the stored reading of ${state.document.pageCount} pages`,
      "This paper has been read before, so it was not sent to the document reader again."
    );

    return {
      paperTitle: readTitle(state.document.textBlocks) ?? state.paperTitle,
      documentPagesRead: 0,
    };
  }

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

  const titleFromDocument = readTitle(document.textBlocks);

  if (titleFromDocument !== null) {
    reportActivity(writer, "info", titleFromDocument, "Title taken from the paper");
  }

  return {
    document,
    paperTitle: titleFromDocument ?? state.paperTitle,
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
