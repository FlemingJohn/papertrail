import { z } from "zod";
import { defineTool } from "../define-tool";
import { resolvedSourceSchema } from "../../schemas/citation";
import {
  extractAuthorNames,
  fetchWorkByDoi,
  normaliseDoi,
  rebuildAbstract,
} from "./openalex-client";

const oneWeekInSeconds = 604800;

export const findSourceByDoi = defineTool({
  name: "find_source_by_doi",
  description:
    "Look up a paper by its DOI and return its title, year, authors, abstract and retraction status. Use this first whenever a reference includes a DOI.",
  inputSchema: z.object({
    digitalObjectIdentifier: z.string().min(4),
  }),
  outputSchema: resolvedSourceSchema,
  cacheSeconds: oneWeekInSeconds,
  availableToAgents: true,
  execute: async ({ digitalObjectIdentifier }) => {
    const work = await fetchWorkByDoi(digitalObjectIdentifier);

    return {
      digitalObjectIdentifier: work.doi === null ? null : normaliseDoi(work.doi),
      title: work.title ?? work.display_name ?? "Untitled",
      publicationYear: work.publication_year,
      authors: extractAuthorNames(work),
      abstract: rebuildAbstract(work.abstract_inverted_index),
      isRetracted: work.is_retracted,
      retractionDate: null,
      retractionReason: null,
      matchConfidence: 1,
    };
  },
});
