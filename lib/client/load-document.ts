import { cache } from "react";
import type { ParsedDocument } from "@/lib/schemas/document";
import type { Report } from "@/lib/schemas/report";
import { readDocumentRecord } from "@/lib/tools/database/list-documents";
import { loadReport } from "./load-report";

export interface StoredPaper {
  documentId: string;
  title: string;
  pageCount: number;
  addedAt: string;
  extractedContent: ParsedDocument | null;
  latestReportId: string | null;
}

export const loadPaper = cache(
  async (documentId: string): Promise<StoredPaper | null> => {
    const outcome = await readDocumentRecord.run(
      { documentId },
      { runIdentifier: null, nodeName: "paper-page", agentName: null }
    );

    return outcome.successful ? outcome.value : null;
  }
);

export const loadLatestReportFor = cache(
  async (documentId: string): Promise<Report | null> => {
    const paper = await loadPaper(documentId);

    if (paper === null || paper.latestReportId === null) {
      return null;
    }

    return await loadReport(paper.latestReportId);
  }
);
