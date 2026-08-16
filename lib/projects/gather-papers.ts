import { createHash } from "node:crypto";
import type { ParsedDocument } from "../schemas/document";
import type { RunEventWriter } from "../types/stream";
import { checkRetraction } from "../tools/external/check-retraction";
import { findRelatedPapers } from "../tools/external/find-related-papers";
import { upsertDocument } from "../tools/database/upsert-document";
import { attachPaper } from "./store";

export interface GatheredPaper {
  documentId: string;
  title: string;
  digitalObjectIdentifier: string | null;
  publicationYear: number | null;
  authors: string[];
  abstract: string;
  isRetracted: boolean;
  retractionNote: string | null;
}

export interface GatherResult {
  papers: GatheredPaper[];
  retractedCount: number;
  searchedCount: number;
}

const wholePagePolygon = [0, 0, 1, 0, 1, 1, 0, 1];

export async function gatherPapers(input: {
  projectId: string;
  question: string;
  field: string;
  paperTarget: number;
  writer: RunEventWriter | null;
}): Promise<GatherResult> {
  const toolContext = {
    runIdentifier: input.projectId,
    nodeName: "finding-papers",
    agentName: null,
  };

  const searchQuery = buildSearchQuery(input.question, input.field);

  const searchOutcome = await findRelatedPapers.run(
    { query: searchQuery, resultLimit: Math.min(25, input.paperTarget * 2) },
    toolContext
  );

  if (!searchOutcome.successful) {
    throw new Error(
      `The paper search did not run: ${searchOutcome.failure.message}`
    );
  }

  const found = searchOutcome.value.papers
    .filter((paper) => paper.abstract !== null && paper.abstract.length > 120)
    .slice(0, input.paperTarget);

  input.writer?.emit({
    type: "activity",
    level: "info",
    message: `Found ${found.length} papers with readable summaries`,
    detail: `${searchOutcome.value.papers.length} works came back from the search. Papers without a readable summary were left out.`,
  });

  const gathered: GatheredPaper[] = [];
  let retractedCount = 0;

  for (const paper of found) {
    let isRetracted = paper.isRetracted;
    let retractionNote: string | null = null;

    if (paper.digitalObjectIdentifier !== null) {
      const retractionOutcome = await checkRetraction.run(
        { digitalObjectIdentifier: paper.digitalObjectIdentifier },
        toolContext
      );

      if (retractionOutcome.successful && retractionOutcome.value.isRetracted) {
        isRetracted = true;
        retractionNote =
          retractionOutcome.value.recordedBy.length === 0
            ? "Recorded as retracted."
            : `Recorded as retracted by ${retractionOutcome.value.recordedBy.join(" and ")}.`;
      }
    }

    if (isRetracted) {
      retractedCount += 1;
      input.writer?.emit({
        type: "activity",
        level: "problem",
        message: `Retracted paper left out: ${paper.title}`,
        detail:
          retractionNote ??
          "This paper is marked as retracted, so nothing in this project will rest on it.",
      });
      continue;
    }

    const abstract = paper.abstract ?? "";
    const fingerprint =
      paper.digitalObjectIdentifier === null
        ? `openalex:${hashText(paper.title)}`
        : `doi:${paper.digitalObjectIdentifier}`;

    const storeOutcome = await upsertDocument.run(
      {
        title: paper.title,
        contentFingerprint: fingerprint,
        pageCount: 1,
        digitalObjectIdentifier: paper.digitalObjectIdentifier,
        extractedContent: buildAbstractDocument(paper.title, abstract),
      },
      toolContext
    );

    if (!storeOutcome.successful) {
      input.writer?.emit({
        type: "activity",
        level: "warning",
        message: `Could not store ${paper.title}`,
        detail: storeOutcome.failure.message,
      });
      continue;
    }

    await attachPaper({
      projectId: input.projectId,
      documentId: storeOutcome.value.documentId,
      reportId: null,
      addedBy: "search",
    });

    gathered.push({
      documentId: storeOutcome.value.documentId,
      title: paper.title,
      digitalObjectIdentifier: paper.digitalObjectIdentifier,
      publicationYear: paper.publicationYear,
      authors: paper.authors,
      abstract,
      isRetracted: false,
      retractionNote: null,
    });
  }

  return {
    papers: gathered,
    retractedCount,
    searchedCount: searchOutcome.value.papers.length,
  };
}

function buildAbstractDocument(
  title: string,
  abstract: string
): ParsedDocument {
  return {
    markdown: `# ${title}\n\n${abstract}`,
    textBlocks: [
      {
        text: title,
        role: "title",
        location: { pageNumber: 1, polygon: wholePagePolygon },
      },
      {
        text: abstract,
        role: "abstract",
        location: { pageNumber: 1, polygon: wholePagePolygon },
      },
    ],
    tables: [],
    figures: [],
    references: [],
    pageCount: 1,
  };
}

function buildSearchQuery(question: string, field: string): string {
  const normalisedField = field.trim().toLowerCase();

  if (normalisedField.length === 0) {
    return question;
  }

  if (question.toLowerCase().includes(normalisedField)) {
    return question;
  }

  return `${question} ${normalisedField}`;
}

function hashText(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}
