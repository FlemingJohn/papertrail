import { cache } from "react";
import type { Report } from "@/lib/schemas/report";
import { readReport } from "@/lib/tools/database/list-reports";

export const loadReport = cache(
  async (reportId: string): Promise<Report | null> => {
    const outcome = await readReport.run(
      { reportId },
      { runIdentifier: null, nodeName: "report-page", agentName: null }
    );

    return outcome.successful ? outcome.value.report : null;
  }
);

export const loadReportPaperId = cache(
  async (reportId: string): Promise<string | null> => {
    const outcome = await readReport.run(
      { reportId },
      { runIdentifier: null, nodeName: "report-page", agentName: null }
    );

    return outcome.successful ? outcome.value.documentId : null;
  }
);
