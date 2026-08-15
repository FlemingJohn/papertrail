import { z } from "zod";
import { defineTool } from "../define-tool";
import { comparisonPaperSchema } from "../../schemas/paper";
import {
  extractAuthorNames,
  normaliseDoi,
  rebuildAbstract,
  searchWorks,
} from "./openalex-client";

const oneDayInSeconds = 86400;

export const findRelatedPapers = defineTool({
  name: "find_related_papers",
  description:
    "Search for papers on the same topic so their findings can be compared with the paper under review. Use short topic phrases rather than full sentences.",
  inputSchema: z.object({
    query: z.string().min(3),
    resultLimit: z.number().int().min(1).max(25).default(10),
  }),
  outputSchema: z.object({
    papers: z.array(comparisonPaperSchema),
  }),
  cacheSeconds: oneDayInSeconds,
  availableToAgents: true,
  execute: async ({ query, resultLimit }) => {
    const response = await searchWorks(query, resultLimit);

    return {
      papers: response.results.map((work) => ({
        digitalObjectIdentifier:
          work.doi === null ? null : normaliseDoi(work.doi),
        title: work.title ?? work.display_name ?? "Untitled",
        publicationYear: work.publication_year,
        authors: extractAuthorNames(work),
        abstract: rebuildAbstract(work.abstract_inverted_index),
        fullText: null,
        isRetracted: work.is_retracted,
        source: "topic-search" as const,
      })),
    };
  },
});
