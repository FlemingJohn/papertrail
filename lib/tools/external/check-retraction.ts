import { z } from "zod";
import { defineTool } from "../define-tool";
import { requestJson } from "../http";
import { normaliseDoi } from "./openalex-client";

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

export const checkRetraction = defineTool({
  name: "check_retraction",
  description:
    "Check whether a paper has been retracted or had a correction issued. Always run this before trusting a source. Returns the retraction date and reason when one exists.",
  inputSchema: z.object({
    digitalObjectIdentifier: z.string().min(4),
  }),
  outputSchema: z.object({
    isRetracted: z.boolean(),
    hasCorrection: z.boolean(),
    retractionDate: z.string().nullable(),
    retractionReason: z.string().nullable(),
  }),
  cacheSeconds: oneDayInSeconds,
  availableToAgents: true,
  execute: async ({ digitalObjectIdentifier }) => {
    const normalized = normaliseDoi(digitalObjectIdentifier);

    const response = await requestJson<CrossrefWorkResponse>(
      `https://api.crossref.org/works/${normalized}`
    );

    const updates = response.message["update-to"] ?? [];

    const retraction = updates.find(
      (update) => update.type.toLowerCase() === "retraction"
    );

    const correction = updates.find((update) =>
      ["correction", "corrigendum", "erratum"].includes(
        update.type.toLowerCase()
      )
    );

    return {
      isRetracted: retraction !== undefined,
      hasCorrection: correction !== undefined,
      retractionDate: retraction?.updated["date-time"] ?? null,
      retractionReason: retraction?.label ?? null,
    };
  },
});
