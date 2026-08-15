import { z } from "zod";
import { defineTool } from "../define-tool";
import { resolvedSourceSchema } from "../../schemas/citation";
import {
  extractAuthorNames,
  normaliseDoi,
  rebuildAbstract,
  searchWorks,
} from "./openalex-client";

const oneWeekInSeconds = 604800;

export const findSourceByTitle = defineTool({
  name: "find_source_by_title",
  description:
    "Find a paper by its title when the reference has no DOI, or when the DOI failed to resolve. Returns the best match with a confidence score between 0 and 1. Treat a match confidence below 0.6 as unreliable.",
  inputSchema: z.object({
    title: z.string().min(8),
    publicationYear: z.number().int().optional(),
  }),
  outputSchema: resolvedSourceSchema,
  cacheSeconds: oneWeekInSeconds,
  availableToAgents: true,
  execute: async ({ title, publicationYear }) => {
    const response = await searchWorks(title, 5);

    if (response.results.length === 0) {
      throw new Error(`No paper found matching the title "${title}"`);
    }

    const candidates =
      publicationYear === undefined
        ? response.results
        : response.results.filter(
            (work) =>
              work.publication_year === null ||
              Math.abs(work.publication_year - publicationYear) <= 1
          );

    const best = (candidates.length > 0 ? candidates : response.results)[0];
    const bestTitle = best.title ?? best.display_name ?? "Untitled";

    return {
      digitalObjectIdentifier: best.doi === null ? null : normaliseDoi(best.doi),
      title: bestTitle,
      publicationYear: best.publication_year,
      authors: extractAuthorNames(best),
      abstract: rebuildAbstract(best.abstract_inverted_index),
      isRetracted: best.is_retracted,
      retractionDate: null,
      retractionReason: null,
      matchConfidence: calculateTitleSimilarity(title, bestTitle),
    };
  },
});

function calculateTitleSimilarity(left: string, right: string): number {
  const leftWords = new Set(tokenise(left));
  const rightWords = new Set(tokenise(right));

  if (leftWords.size === 0 || rightWords.size === 0) {
    return 0;
  }

  let sharedCount = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) {
      sharedCount += 1;
    }
  }

  const unionSize = new Set([...leftWords, ...rightWords]).size;
  return Math.round((sharedCount / unionSize) * 100) / 100;
}

function tokenise(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}
