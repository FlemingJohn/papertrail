import type { ResolvedSource } from "../schemas/citation";
import type { ExcludedCitation } from "../schemas/project";

export interface BibliographyEntry {
  citationKey: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  digitalObjectIdentifier: string | null;
}

export interface CandidateSource {
  source: ResolvedSource;
  verdict: string;
}

export interface Bibliography {
  entries: BibliographyEntry[];
  excluded: ExcludedCitation[];
  bibtex: string;
}

const acceptedVerdicts = new Set([
  "supported",
  "partly-supported",
  "verified",
]);

const exclusionReasons: Record<string, string> = {
  retracted: "The source is retracted.",
  "source-not-found": "The source could not be found in any database.",
  "wrong-source": "The source does not say what it was cited for.",
  "not-supported": "The source does not support the statement it was cited for.",
  "partly-supported": "The source only partly supports the statement it was cited for.",
  "could-not-check": "The source exists but its text could not be read.",
  "indirect-source": "The source repeats another paper rather than reporting it.",
};

export function buildBibliography(
  candidates: readonly CandidateSource[]
): Bibliography {
  const entries: BibliographyEntry[] = [];
  const excluded: ExcludedCitation[] = [];
  const usedKeys = new Set<string>();

  for (const candidate of candidates) {
    const { source, verdict } = candidate;

    if (!acceptedVerdicts.has(verdict)) {
      excluded.push({
        reference: describeSource(source),
        reason:
          exclusionReasons[verdict] ??
          "The check on this source did not confirm it.",
      });
      continue;
    }

    if (source.isRetracted) {
      excluded.push({
        reference: describeSource(source),
        reason: "The source is retracted.",
      });
      continue;
    }

    const citationKey = makeCitationKey(source, usedKeys);
    usedKeys.add(citationKey);

    entries.push({
      citationKey,
      title: source.title,
      authors: source.authors,
      publicationYear: source.publicationYear,
      digitalObjectIdentifier: source.digitalObjectIdentifier,
    });
  }

  return { entries, excluded, bibtex: renderBibtex(entries) };
}

export function renderBibtex(entries: readonly BibliographyEntry[]): string {
  return entries
    .map((entry) => {
      const fields: string[] = [
        `  title = {${cleanBraces(entry.title)}}`,
        `  author = {${
          entry.authors.length === 0
            ? "Unknown"
            : entry.authors.map(cleanBraces).join(" and ")
        }}`,
      ];

      if (entry.publicationYear !== null) {
        fields.push(`  year = {${entry.publicationYear}}`);
      }

      if (entry.digitalObjectIdentifier !== null) {
        fields.push(`  doi = {${cleanBraces(entry.digitalObjectIdentifier)}}`);
      }

      return `@article{${entry.citationKey},\n${fields.join(",\n")}\n}`;
    })
    .join("\n\n");
}

function describeSource(source: ResolvedSource): string {
  const year =
    source.publicationYear === null ? "year unknown" : String(source.publicationYear);

  return `${source.title} (${year})`;
}

function makeCitationKey(
  source: ResolvedSource,
  usedKeys: ReadonlySet<string>
): string {
  const surname = extractSurname(source.authors[0] ?? "unknown");
  const year = source.publicationYear ?? 0;
  const word = firstMeaningfulWord(source.title);
  const base = `${surname}${year}${word}`;

  if (!usedKeys.has(base)) {
    return base;
  }

  let suffix = 1;
  while (usedKeys.has(`${base}${suffix}`)) {
    suffix += 1;
  }

  return `${base}${suffix}`;
}

function extractSurname(author: string): string {
  const parts = author.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "unknown";
  const cleaned = last.replace(/[^A-Za-z]/g, "").toLowerCase();

  return cleaned.length === 0 ? "unknown" : cleaned;
}

const skippedWords = new Set([
  "a",
  "an",
  "the",
  "on",
  "of",
  "in",
  "for",
  "and",
  "to",
  "with",
]);

function firstMeaningfulWord(title: string): string {
  const words = title.toLowerCase().split(/[^a-z]+/).filter(Boolean);

  for (const word of words) {
    if (!skippedWords.has(word) && word.length > 2) {
      return word;
    }
  }

  return "untitled";
}

function cleanBraces(value: string): string {
  return value.replace(/[{}]/g, "");
}
