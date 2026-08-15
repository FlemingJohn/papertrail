import type {
  CitationVerdict,
  ConfidenceLevel,
  SeverityLevel,
} from "@/lib/schemas/verdict";
import {
  citationVerdictLabels,
  confidenceLevelLabels,
  severityLabels,
} from "@/lib/config/labels";
import { pill } from "@/lib/design/tokens";

const verdictColours: Record<CitationVerdict, string> = {
  supported: "text-verdict-supported border-verdict-supported/50",
  "partly-supported":
    "text-verdict-partly-supported border-verdict-partly-supported/50",
  "indirect-source":
    "text-verdict-indirect-source border-verdict-indirect-source/50",
  "wrong-source": "text-verdict-wrong-source border-verdict-wrong-source/50",
  "not-supported": "text-verdict-not-supported border-verdict-not-supported/50",
  retracted: "text-verdict-retracted border-verdict-retracted/60",
  "source-not-found":
    "text-verdict-source-not-found border-verdict-source-not-found/50",
  "could-not-check":
    "text-verdict-could-not-check border-verdict-could-not-check/50",
};

const confidenceColours: Record<ConfidenceLevel, string> = {
  high: "text-confidence-high border-confidence-high/50",
  moderate: "text-confidence-moderate border-confidence-moderate/50",
  low: "text-confidence-low border-confidence-low/50",
  "very-low": "text-confidence-very-low border-confidence-very-low/60",
};

const severityColours: Record<SeverityLevel, string> = {
  critical: "text-severity-critical border-severity-critical/60",
  major: "text-severity-major border-severity-major/50",
  minor: "text-severity-minor border-severity-minor/50",
};

export function VerdictBadge({ verdict }: { verdict: CitationVerdict }) {
  return (
    <span className={`${pill} ${verdictColours[verdict]}`}>
      {citationVerdictLabels[verdict]}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={`${pill} ${confidenceColours[level]}`}>
      {confidenceLevelLabels[level]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`${pill} ${severityColours[severity]}`}>
      {severityLabels[severity]}
    </span>
  );
}

export function NeutralPill({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${pill} border-white/20 text-muted-foreground`}>
      {children}
    </span>
  );
}
