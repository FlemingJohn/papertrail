import type { ResolvedSource } from "../schemas/citation";
import type { Report } from "../schemas/report";
import { findSourceByDoi } from "../tools/external/find-source-by-doi";
import type { CandidateSource } from "../draft/build-bibliography";
import type { ProjectPaperRecord } from "./store";

export async function collectSources(input: {
  projectId: string;
  papers: readonly ProjectPaperRecord[];
  reports: readonly Report[];
}): Promise<CandidateSource[]> {
  const toolContext = {
    runIdentifier: input.projectId,
    nodeName: "drafting",
    agentName: null,
  };

  const candidates: CandidateSource[] = [];
  const seen = new Set<string>();

  for (const paper of input.papers) {
    if (paper.digitalObjectIdentifier === null) {
      candidates.push({
        source: buildPlaceholderSource(paper.title),
        verdict: "could-not-check",
      });
      continue;
    }

    const key = paper.digitalObjectIdentifier.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    const outcome = await findSourceByDoi.run(
      { digitalObjectIdentifier: paper.digitalObjectIdentifier },
      toolContext
    );

    if (!outcome.successful) {
      candidates.push({
        source: buildPlaceholderSource(paper.title),
        verdict: "source-not-found",
      });
      continue;
    }

    candidates.push({
      source: outcome.value,
      verdict: outcome.value.isRetracted ? "retracted" : "verified",
    });
  }

  for (const report of input.reports) {
    for (const check of report.citationChecks) {
      const source = check.resolvedSource;

      if (source === null) {
        continue;
      }

      const key = (
        source.digitalObjectIdentifier ?? source.title
      ).toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      candidates.push({ source, verdict: check.judgement.verdict });
    }
  }

  return candidates;
}

function buildPlaceholderSource(title: string): ResolvedSource {
  return {
    digitalObjectIdentifier: null,
    title,
    publicationYear: null,
    authors: [],
    abstract: null,
    isRetracted: false,
    retractionDate: null,
    retractionReason: null,
    matchConfidence: 0,
  };
}
