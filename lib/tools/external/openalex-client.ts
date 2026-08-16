import { getServerEnvironment } from "../../config/environment";
import { requestJson } from "../http";

const openAlexBaseUrl = "https://api.openalex.org";

export interface OpenAlexAuthorship {
  author: { display_name: string };
}

export interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string | null;
  display_name: string | null;
  publication_year: number | null;
  authorships: OpenAlexAuthorship[];
  abstract_inverted_index: Record<string, number[]> | null;
  is_retracted: boolean;
  referenced_works: string[];
  relevance_score?: number;
}

export interface OpenAlexListResponse {
  results: OpenAlexWork[];
  meta: { count: number };
}

function buildHeaders(): Record<string, string> {
  const environment = getServerEnvironment();

  const headers: Record<string, string> = {
    "User-Agent": `PaperTrail (mailto:${environment.OPENALEX_CONTACT_EMAIL})`,
  };

  if (environment.OPENALEX_API_KEY !== undefined) {
    headers.Authorization = `Bearer ${environment.OPENALEX_API_KEY}`;
  }

  return headers;
}

export async function fetchWorkByDoi(
  digitalObjectIdentifier: string
): Promise<OpenAlexWork> {
  const normalized = normaliseDoi(digitalObjectIdentifier);
  return await requestJson<OpenAlexWork>(
    `${openAlexBaseUrl}/works/doi:${normalized}`,
    { headers: buildHeaders() }
  );
}

export async function fetchWorkById(identifier: string): Promise<OpenAlexWork> {
  const shortIdentifier = identifier.replace(`${openAlexBaseUrl}/`, "");
  return await requestJson<OpenAlexWork>(
    `${openAlexBaseUrl}/works/${shortIdentifier}`,
    { headers: buildHeaders() }
  );
}

export async function searchWorks(
  query: string,
  resultLimit: number
): Promise<OpenAlexListResponse> {
  return await requestJson<OpenAlexListResponse>(`${openAlexBaseUrl}/works`, {
    headers: buildHeaders(),
    searchParameters: {
      search: query,
      per_page: resultLimit,
      select:
        "id,doi,title,display_name,publication_year,authorships,abstract_inverted_index,is_retracted,referenced_works",
    },
  });
}

export async function fetchCitingWorks(
  identifier: string,
  resultLimit: number
): Promise<OpenAlexListResponse> {
  const shortIdentifier = identifier.replace(`${openAlexBaseUrl}/`, "");
  return await requestJson<OpenAlexListResponse>(`${openAlexBaseUrl}/works`, {
    headers: buildHeaders(),
    searchParameters: {
      filter: `cites:${shortIdentifier}`,
      per_page: resultLimit,
      select:
        "id,doi,title,display_name,publication_year,authorships,abstract_inverted_index,is_retracted",
    },
  });
}

export function rebuildAbstract(
  invertedIndex: Record<string, number[]> | null
): string | null {
  if (invertedIndex === null) {
    return null;
  }

  const positions: Array<{ position: number; word: string }> = [];

  for (const [word, indexes] of Object.entries(invertedIndex)) {
    for (const index of indexes) {
      positions.push({ position: index, word });
    }
  }

  if (positions.length === 0) {
    return null;
  }

  positions.sort((left, right) => left.position - right.position);

  return positions.map((entry) => entry.word).join(" ");
}

export function extractAuthorNames(work: OpenAlexWork): string[] {
  return work.authorships.map((authorship) => authorship.author.display_name);
}

export function normaliseDoi(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:/, "");
}
