import { z } from "zod";
import { defineTool } from "../define-tool";
import { requestJson } from "../http";
import { normaliseDoi } from "./openalex-client";
import { getServerEnvironment } from "../../config/environment";

const oneDayInSeconds = 86400;

interface CrossrefUpdate {
  type: string;
  updated: { "date-time": string };
  label?: string;
}

interface CrossrefWorkResponse {
  message: {
    "update-to"?: CrossrefUpdate[];
    title?: string[];
  };
}

interface OpenAlexRetractionResponse {
  is_retracted: boolean;
}

export const checkRetraction = defineTool({
  name: "check_retraction",
  description:
    "Check whether a paper has been retracted or had a correction issued. Always run this before trusting a source. Two independent registries are consulted, because each misses retractions the other records.",
  inputSchema: z.object({
    digitalObjectIdentifier: z.string().min(4),
  }),
  outputSchema: z.object({
    isRetracted: z.boolean(),
    hasCorrection: z.boolean(),
    retractionDate: z.string().nullable(),
    retractionReason: z.string().nullable(),
    recordedBy: z.array(z.string()),
  }),
  cacheSeconds: oneDayInSeconds,
  availableToAgents: true,
  execute: async ({ digitalObjectIdentifier }) => {
    const normalized = normaliseDoi(digitalObjectIdentifier);
    const environment = getServerEnvironment();

    const headers = {
      "User-Agent": `PaperTrail (mailto:${environment.OPENALEX_CONTACT_EMAIL})`,
    };

    const [crossref, openAlex] = await Promise.allSettled([
      requestJson<CrossrefWorkResponse>(
        `https://api.crossref.org/works/${normalized}`,
        { headers }
      ),
      requestJson<OpenAlexRetractionResponse>(
        `https://api.openalex.org/works/doi:${normalized}`,
        { headers, searchParameters: { select: "is_retracted" } }
      ),
    ]);

    const recordedBy: string[] = [];
    let retractionDate: string | null = null;
    let retractionReason: string | null = null;
    let hasCorrection = false;

    if (crossref.status === "fulfilled") {
      const updates = crossref.value.message["update-to"] ?? [];

      const retraction = updates.find(
        (update) => update.type.toLowerCase() === "retraction"
      );

      hasCorrection = updates.some((update) =>
        ["correction", "corrigendum", "erratum"].includes(
          update.type.toLowerCase()
        )
      );

      if (retraction !== undefined) {
        recordedBy.push("crossref");
        retractionDate = retraction.updated["date-time"];
        retractionReason = retraction.label ?? null;
      }
    }

    if (openAlex.status === "fulfilled" && openAlex.value.is_retracted) {
      recordedBy.push("openalex");
    }

    if (crossref.status === "rejected" && openAlex.status === "rejected") {
      throw new Error(
        `Neither registry could be reached for ${normalized}`
      );
    }

    return {
      isRetracted: recordedBy.length > 0,
      hasCorrection,
      retractionDate,
      retractionReason,
      recordedBy,
    };
  },
});
