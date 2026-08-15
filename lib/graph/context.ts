import type { DocumentTable, PageLocation } from "../schemas/document";
import type { Claim } from "../schemas/claim";
import type { CitationCheck } from "../schemas/citation";
import type { Measurement } from "../schemas/measurement";
import type { MissingDetail } from "../schemas/method";
import type { Conflict } from "../schemas/conflict";
import type { ReviewPoint } from "../schemas/review";
import type { ComparisonPaper } from "../schemas/paper";
import type { IndexedBlock } from "./sections";
import {
  citationVerdictLabels,
  missingDetailCategoryLabels,
  reviewAngleLabels,
} from "../config/labels";

const maximumBlockCharacters = 70000;

const minimumBlockCharacters = 25;

export interface BlockIndexMap {
  text: string;
  locationByIndex: Map<number, PageLocation>;
}

export function describeIndexedBlocks(
  indexed: IndexedBlock[]
): BlockIndexMap {
  const lines: string[] = [];
  const locationByIndex = new Map<number, PageLocation>();
  let usedCharacters = 0;
  let wasTruncated = false;

  for (const entry of indexed) {
    const text = entry.block.text.trim();

    if (text.length < minimumBlockCharacters) {
      continue;
    }

    const line = `[b${entry.index}|p${entry.block.location.pageNumber}] ${text}`;

    if (usedCharacters + line.length > maximumBlockCharacters) {
      wasTruncated = true;
      break;
    }

    lines.push(line);
    locationByIndex.set(entry.index, entry.block.location);
    usedCharacters += line.length;
  }

  if (wasTruncated) {
    lines.push("[text truncated because the paper exceeded the reading limit]");
  }

  return { text: lines.join("\n"), locationByIndex };
}

export function describeTables(tables: DocumentTable[]): string {
  return tables
    .map((table, index) => {
      const rows = new Map<number, string[]>();

      for (const cell of table.cells) {
        const row = rows.get(cell.rowIndex) ?? [];
        row[cell.columnIndex] = cell.text;
        rows.set(cell.rowIndex, row);
      }

      const rendered = [...rows.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([, columns]) => columns.join(" | "))
        .join("\n");

      return `Table ${index + 1} [p${table.location.pageNumber}] ${table.caption ?? ""}\n${rendered}`;
    })
    .join("\n\n");
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
