import type { CitationVerdict, ConfidenceLevel, SeverityLevel } from "@/lib/schemas/verdict";
import {
  citationVerdictLabels,
  confidenceLevelLabels,
  severityLabels,
} from "@/lib/config/labels";

const verdictColours: Record<CitationVerdict, string> = {
  supported: "text-verdict-supported border-verdict-supported/40",
  "partly-supported":
    "text-verdict-partly-supported border-verdict-partly-supported/40",
  "indirect-source":
    "text-verdict-indirect-source border-verdict-indirect-source/40",
  "wrong-source": "text-verdict-wrong-source border-verdict-wrong-source/40",
  "not-supported": "text-verdict-not-supported border-verdict-not-supported/40",
  retracted: "text-verdict-retracted border-verdict-retracted/50",
  "source-not-found":
    "text-verdict-source-not-found border-verdict-source-not-found/40",
  "could-not-check":
    "text-verdict-could-not-check border-verdict-could-not-check/40",
};

const confidenceColours: Record<ConfidenceLevel, string> = {
  high: "text-confidence-high border-confidence-high/40",
  moderate: "text-confidence-moderate border-confidence-moderate/40",
  low: "text-confidence-low border-confidence-low/40",
  "very-low": "text-confidence-very-low border-confidence-very-low/50",
};

const severityColours: Record<SeverityLevel, string> = {
  critical: "text-severity-critical border-severity-critical/50",
  major: "text-severity-major border-severity-major/40",
  minor: "text-severity-minor border-severity-minor/40",
};

const badgeBase =
  "inline-flex items-center border px-2 py-0.5 text-xs whitespace-nowrap";

export function VerdictBadge({ verdict }: { verdict: CitationVerdict }) {
  return (
    <span className={`${badgeBase} ${verdictColours[verdict]}`}>
      {citationVerdictLabels[verdict]}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={`${badgeBase} ${confidenceColours[level]}`}>
      {confidenceLevelLabels[level]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`${badgeBase} ${severityColours[severity]}`}>
      {severityLabels[severity]}
    </span>
  );
}
