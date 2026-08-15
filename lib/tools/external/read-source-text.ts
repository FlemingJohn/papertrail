import { z } from "zod";
import { defineTool } from "../define-tool";
import { requestJson, requestText } from "../http";
import { normaliseDoi } from "./openalex-client";

const oneWeekInSeconds = 604800;

const europePmcBaseUrl = "https://www.ebi.ac.uk/europepmc/webservices/rest";

const maximumCharacters = 40000;

interface EuropePmcSearchResponse {
  resultList: {
    result: Array<{
      id: string;
      source: string;
      title: string;
      abstractText?: string;
      isOpenAccess: string;
      hasTextMinedTerms?: string;
    }>;
  };
}

export const readSourceText = defineTool({
  name: "read_source_text",
  description:
    "Read the text of a cited paper so you can check what it actually says. Returns the full text when the paper is open access, otherwise the abstract. The coverage field tells you which one you received.",
  inputSchema: z.object({
    digitalObjectIdentifier: z.string().min(4),
  }),
  outputSchema: z.object({
    coverage: z.enum(["full-text", "abstract-only", "unavailable"]),
    title: z.string(),
    text: z.string(),
    characterCount: z.number().int().nonnegative(),
  }),
  cacheSeconds: oneWeekInSeconds,
  timeoutMilliseconds: 25000,
  availableToAgents: true,
  execute: async ({ digitalObjectIdentifier }) => {
    const normalized = normaliseDoi(digitalObjectIdentifier);

    const search = await requestJson<EuropePmcSearchResponse>(
      `${europePmcBaseUrl}/search`,
      {
        searchParameters: {
          query: `DOI:"${normalized}"`,
          format: "json",
          pageSize: 1,
          resultType: "core",
        },
      }
    );

    const record = search.resultList.result[0];

    if (record === undefined) {
      throw new Error(`No indexed record found for DOI ${normalized}`);
    }

    if (record.isOpenAccess === "Y") {
      try {
        const xml = await requestText(
          `${europePmcBaseUrl}/${record.source}/${record.id}/fullTextXML`
        );
        const plainText = stripXmlTags(xml).slice(0, maximumCharacters);

        if (plainText.length > 500) {
          return {
            coverage: "full-text" as const,
            title: record.title,
            text: plainText,
            characterCount: plainText.length,
          };
        }
      } catch {
        return buildAbstractResult(record.title, record.abstractText);
      }
    }

    return buildAbstractResult(record.title, record.abstractText);
  },
});

function buildAbstractResult(
  title: string,
  abstractText: string | undefined
): {
  coverage: "abstract-only" | "unavailable";
  title: string;
  text: string;
  characterCount: number;
} {
  if (abstractText === undefined || abstractText.length === 0) {
    return {
      coverage: "unavailable",
      title,
      text: "",
      characterCount: 0,
    };
  }

  return {
    coverage: "abstract-only",
    title,
    text: abstractText,
    characterCount: abstractText.length,
  };
}

function stripXmlTags(xml: string): string {
  return xml
    .replace(/<ref-list[\s\S]*?<\/ref-list>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
