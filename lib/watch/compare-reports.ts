import type { Report } from "../schemas/report";
import type { CitationVerdict } from "../schemas/verdict";
import type { ConfidenceLevel } from "../schemas/verdict";

export interface VerdictShift {
  claimIdentifier: string;
  marker: string;
  previousVerdict: CitationVerdict;
  currentVerdict: CitationVerdict;
  sourceTitle: string | null;
}

export interface ConfidenceShift {
  claimIdentifier: string;
  previousLevel: ConfidenceLevel;
  currentLevel: ConfidenceLevel;
}

export interface ValueShift {
  claimIdentifier: string;
  previousValue: number | null;
  currentValue: number | null;
}

export interface StructuralDifference {
  verdictShifts: VerdictShift[];
  newRetractions: VerdictShift[];
  confidenceShifts: ConfidenceShift[];
  valueShifts: ValueShift[];
  openedConflicts: string[];
  closedConflicts: string[];
  newlyExplainedConflicts: string[];
  comparisonPapersAdded: number;
  citationsNewlyReadable: number;
  hasAnyDifference: boolean;
}

export function compareReports(
  previous: Report,
  current: Report
): StructuralDifference {
  const verdictShifts = collectVerdictShifts(previous, current);

  const difference: StructuralDifference = {
    verdictShifts,
    newRetractions: verdictShifts.filter(
      (shift) =>
        shift.currentVerdict === "retracted" &&
        shift.previousVerdict !== "retracted"
    ),
    confidenceShifts: collectConfidenceShifts(previous, current),
    valueShifts: collectValueShifts(previous, current),
    openedConflicts: current.conflicts
      .filter(
        (conflict) =>
          !previous.conflicts.some(
            (earlier) => earlier.question === conflict.question
          )
      )
      .map((conflict) => conflict.question),
    closedConflicts: previous.conflicts
      .filter(
        (conflict) =>
          !current.conflicts.some(
            (later) => later.question === conflict.question
          )
      )
      .map((conflict) => conflict.question),
    newlyExplainedConflicts: current.conflicts
      .filter((conflict) => {
        if (conflict.explanation === null) {
          return false;
        }
        const earlier = previous.conflicts.find(
          (candidate) => candidate.question === conflict.question
        );
        return earlier !== undefined && earlier.explanation === null;
      })
      .map((conflict) => conflict.question),
    comparisonPapersAdded:
      current.coverage.comparisonPapersUsed -
      previous.coverage.comparisonPapersUsed,
    citationsNewlyReadable:
      previous.coverage.citationsUncheckable -
      current.coverage.citationsUncheckable,
    hasAnyDifference: false,
  };

  difference.hasAnyDifference =
    difference.verdictShifts.length > 0 ||
    difference.confidenceShifts.length > 0 ||
    difference.valueShifts.length > 0 ||
    difference.openedConflicts.length > 0 ||
    difference.closedConflicts.length > 0 ||
    difference.newlyExplainedConflicts.length > 0;

  return difference;
}

function collectVerdictShifts(
  previous: Report,
  current: Report
): VerdictShift[] {
  const previousByKey = new Map(
    previous.citationChecks.map((check) => [
      `${check.claimIdentifier}|${check.marker}`,
      check,
    ])
  );

  const shifts: VerdictShift[] = [];

  for (const check of current.citationChecks) {
    const key = `${check.claimIdentifier}|${check.marker}`;
    const earlier = previousByKey.get(key);

    if (earlier === undefined) {
      continue;
    }

    if (earlier.judgement.verdict === check.judgement.verdict) {
      continue;
    }

    shifts.push({
      claimIdentifier: check.claimIdentifier,
      marker: check.marker,
      previousVerdict: earlier.judgement.verdict,
      currentVerdict: check.judgement.verdict,
      sourceTitle: check.resolvedSource?.title ?? null,
    });
  }

  return shifts;
}

function collectConfidenceShifts(
  previous: Report,
  current: Report
): ConfidenceShift[] {
  const previousByClaim = new Map(
    previous.confidenceRatings.map((rating) => [rating.claimIdentifier, rating])
  );

  const shifts: ConfidenceShift[] = [];

  for (const rating of current.confidenceRatings) {
    const earlier = previousByClaim.get(rating.claimIdentifier);

    if (earlier === undefined || earlier.level === rating.level) {
      continue;
    }

    shifts.push({
      claimIdentifier: rating.claimIdentifier,
      previousLevel: earlier.level,
      currentLevel: rating.level,
    });
  }

  return shifts;
}

function collectValueShifts(previous: Report, current: Report): ValueShift[] {
  const previousByClaim = new Map(
    previous.measurements.map((measurement) => [
      measurement.claimIdentifier,
      measurement,
    ])
  );

  const shifts: ValueShift[] = [];

  for (const measurement of current.measurements) {
    const earlier = previousByClaim.get(measurement.claimIdentifier);

    if (earlier === undefined) {
      continue;
    }

    const previousValue = earlier.agreedValue?.value ?? null;
    const currentValue = measurement.agreedValue?.value ?? null;

    if (previousValue === currentValue) {
      continue;
    }

    if (previousValue !== null && currentValue !== null) {
      const scale = Math.max(
        Math.abs(previousValue),
        Math.abs(currentValue),
        1
      );

      if (Math.abs(previousValue - currentValue) / scale < 0.02) {
        continue;
      }
    }

    shifts.push({
      claimIdentifier: measurement.claimIdentifier,
      previousValue,
      currentValue,
    });
  }

  return shifts;
}

export function describeDifference(
  difference: StructuralDifference,
  previous: Report,
  current: Report
): string {
  const lines: string[] = [];

  lines.push(`Paper: ${current.paperTitle}`);
  lines.push(
    `Citations checked: ${previous.coverage.citationsChecked} previously, ${current.coverage.citationsChecked} now`
  );
  lines.push(
    `Comparison papers: ${previous.coverage.comparisonPapersUsed} previously, ${current.coverage.comparisonPapersUsed} now`
  );
  lines.push("");

  if (difference.newRetractions.length > 0) {
    lines.push("Sources retracted since the last check:");
    for (const shift of difference.newRetractions) {
      lines.push(
        `  ${shift.claimIdentifier} ${shift.marker}: ${shift.sourceTitle ?? "source"} is now retracted`
      );
    }
    lines.push("");
  }

  if (difference.verdictShifts.length > 0) {
    lines.push("Citation verdicts that changed:");
    for (const shift of difference.verdictShifts) {
      lines.push(
        `  ${shift.claimIdentifier} ${shift.marker}: ${shift.previousVerdict} became ${shift.currentVerdict}`
      );
    }
    lines.push("");
  }

  if (difference.valueShifts.length > 0) {
    lines.push("Extracted values that changed:");
    for (const shift of difference.valueShifts) {
      lines.push(
        `  ${shift.claimIdentifier}: ${shift.previousValue ?? "none"} became ${shift.currentValue ?? "none"}`
      );
    }
    lines.push("");
  }

  if (difference.confidenceShifts.length > 0) {
    lines.push("Confidence ratings that changed:");
    for (const shift of difference.confidenceShifts) {
      lines.push(
        `  ${shift.claimIdentifier}: ${shift.previousLevel} became ${shift.currentLevel}`
      );
    }
    lines.push("");
  }

  if (difference.openedConflicts.length > 0) {
    lines.push("Disagreements that appeared:");
    for (const question of difference.openedConflicts) {
      lines.push(`  ${question}`);
    }
    lines.push("");
  }

  if (difference.closedConflicts.length > 0) {
    lines.push("Disagreements no longer present:");
    for (const question of difference.closedConflicts) {
      lines.push(`  ${question}`);
    }
    lines.push("");
  }

  if (difference.newlyExplainedConflicts.length > 0) {
    lines.push("Disagreements now explained:");
    for (const question of difference.newlyExplainedConflicts) {
      lines.push(`  ${question}`);
    }
    lines.push("");
  }

  if (difference.citationsNewlyReadable > 0) {
    lines.push(
      `${difference.citationsNewlyReadable} sources became readable that previously could not be checked.`
    );
  }

  return lines.join("\n");
}
