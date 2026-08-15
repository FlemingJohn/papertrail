import type { TextBlock } from "../schemas/document";
import type { Claim } from "../schemas/claim";
import type { CitationCheck } from "../schemas/citation";
import type { Measurement } from "../schemas/measurement";
import type { MissingDetail } from "../schemas/method";
import type { Conflict } from "../schemas/conflict";
import type { ReviewPoint } from "../schemas/review";
import type { ComparisonPaper } from "../schemas/paper";
import {
  citationVerdictLabels,
  missingDetailCategoryLabels,
  reviewAngleLabels,
} from "../config/labels";

const maximumBlockCharacters = 90000;

export function describeBlocks(blocks: TextBlock[]): string {
  const lines: string[] = [];
  let usedCharacters = 0;

  for (const block of blocks) {
    const line = `[page ${block.location.pageNumber}] [${block.location.polygon.join(",")}] ${block.text}`;

    if (usedCharacters + line.length > maximumBlockCharacters) {
      lines.push("[text truncated because the paper exceeded the reading limit]");
      break;
    }

    lines.push(line);
    usedCharacters += line.length;
  }

  return lines.join("\n");
}

export function describeClaims(claims: Claim[]): string {
  return claims
    .map(
      (claim) =>
        `${claim.identifier} (${claim.kind}, page ${claim.location.pageNumber}): ${claim.text}`
    )
    .join("\n");
}

export function describePapers(papers: ComparisonPaper[]): string {
  return papers
    .map((paper, index) => {
      const identifier = paper.digitalObjectIdentifier ?? `paper-${index + 1}`;
      const year = paper.publicationYear ?? "year unknown";
      const body = paper.fullText ?? paper.abstract ?? "No text available.";
      return `${identifier} | ${paper.title} (${year})\n${body}`;
    })
    .join("\n\n");
}

export function describeCitationChecks(checks: CitationCheck[]): string {
  return checks
    .map((check) => {
      const verdict = citationVerdictLabels[check.judgement.verdict];
      const source =
        check.resolvedSource === null
          ? "source not resolved"
          : `${check.resolvedSource.title} (${check.resolvedSource.publicationYear ?? "year unknown"})`;
      return `${check.claimIdentifier} ${check.marker} -> ${verdict}. Source: ${source}. ${check.judgement.reasoning}`;
    })
    .join("\n");
}

export function describeMeasurements(measurements: Measurement[]): string {
  return measurements
    .map((measurement) => {
      const value = measurement.agreedValue;

      if (value === null) {
        return `${measurement.claimIdentifier}: no agreed value (${measurement.status}), agreement ${measurement.agreementScore.toFixed(2)}`;
      }

      const range =
        value.errorRangeLow === null || value.errorRangeHigh === null
          ? "no error range"
          : `range ${value.errorRangeLow} to ${value.errorRangeHigh}`;

      return `${measurement.claimIdentifier}: ${value.value ?? "no value"} ${value.unit ?? ""} (${value.kind}), sample ${value.sampleSize ?? "unstated"}, ${range}, agreement ${measurement.agreementScore.toFixed(2)}`;
    })
    .join("\n");
}

export function describeMissingDetails(details: MissingDetail[]): string {
  return details
    .map(
      (detail) =>
        `${detail.severity}: ${missingDetailCategoryLabels[detail.category]} - ${detail.description}`
    )
    .join("\n");
}

export function describeConflicts(conflicts: Conflict[]): string {
  return conflicts
    .map((conflict) => {
      const groups = conflict.groups
        .map(
          (group) =>
            `  ${group.label} (${group.direction}): ${group.studyIdentifiers.join(", ")}`
        )
        .join("\n");
      const explanation =
        conflict.explanation === null
          ? "  no explanation found"
          : `  explained by ${conflict.explanation.differingFactor}`;
      return `${conflict.identifier}: ${conflict.question}\n${groups}\n${explanation}`;
    })
    .join("\n\n");
}

export function describeReviewPoints(points: ReviewPoint[]): string {
  return points
    .map(
      (point) =>
        `[${reviewAngleLabels[point.angle]}] ${point.severity}: ${point.summary}\n${point.detail}`
    )
    .join("\n\n");
}
