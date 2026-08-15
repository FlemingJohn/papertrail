import { z } from "zod";
import { defineTool } from "../define-tool";
import {
  fetchWorkByDoi,
  fetchWorkById,
  normaliseDoi,
} from "./openalex-client";

const oneWeekInSeconds = 604800;

const maximumReferences = 40;

export const listSourceReferences = defineTool({
  name: "list_source_references",
  description:
    "List the papers that a given paper cites. Use this to find out whether a source is reporting its own result or repeating someone else's. A short reference list on a review article is a strong hint that the source is not original.",
  inputSchema: z.object({
    digitalObjectIdentifier: z.string().min(4),
  }),
  outputSchema: z.object({
    references: z.array(
      z.object({
        digitalObjectIdentifier: z.string().nullable(),
        title: z.string(),
        publicationYear: z.number().int().nullable(),
      })
    ),
    totalCount: z.number().int().nonnegative(),
    wasTruncated: z.boolean(),
  }),
  cacheSeconds: oneWeekInSeconds,
  timeoutMilliseconds: 30000,
  availableToAgents: true,
  execute: async ({ digitalObjectIdentifier }) => {
    const work = await fetchWorkByDoi(digitalObjectIdentifier);
    const referenceIdentifiers = work.referenced_works ?? [];
    const selected = referenceIdentifiers.slice(0, maximumReferences);

    const settled = await Promise.allSettled(
      selected.map((identifier) => fetchWorkById(identifier))
    );

    const references = settled
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .map((referenced) => ({
        digitalObjectIdentifier:
          referenced.doi === null ? null : normaliseDoi(referenced.doi),
        title: referenced.title ?? referenced.display_name ?? "Untitled",
        publicationYear: referenced.publication_year,
      }));

    return {
      references,
      totalCount: referenceIdentifiers.length,
      wasTruncated: referenceIdentifiers.length > maximumReferences,
    };
  },
});
