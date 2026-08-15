import type { DetectedChange, Importance } from "@/lib/schemas/watch";
import { changeKindLabels, importanceLabels } from "@/lib/config/labels";
import { ArrowRightIcon } from "./icons";

const seriousKinds: ReadonlyArray<DetectedChange["kind"]> = [
  "source-retracted",
  "combined-result-shifted",
];

export function ChangeCard({ change }: { change: DetectedChange }) {
  const isSerious = seriousKinds.includes(change.kind);

  return (
    <article
      className={`border bg-card/40 p-4 ${
        isSerious ? "border-verdict-retracted/40" : "border-border/60"
      }`}
    >
      <p
        className={`mb-1.5 text-xs tracking-wide uppercase ${
          isSerious ? "text-verdict-retracted" : "text-muted-foreground"
        }`}
      >
        {changeKindLabels[change.kind]}
      </p>

      <p className="mb-3 text-sm text-foreground">{change.headline}</p>

      {change.previousValue === null && change.currentValue === null ? null : (
        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-muted-foreground line-through">
            {change.previousValue ?? "not present"}
          </span>
          <ArrowRightIcon className="size-3.5 text-muted-foreground" />
          <span className="text-foreground">
            {change.currentValue ?? "not present"}
          </span>
        </div>
      )}

      <p className="border-l-2 border-accent/50 pl-3 text-sm text-muted-foreground">
        {change.cause}
      </p>

      {change.affectedClaimIdentifiers.length === 0 ? null : (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Affects {change.affectedClaimIdentifiers.join(", ")}
        </p>
      )}
    </article>
  );
}

const importanceColours: Record<Importance, string> = {
  high: "text-verdict-retracted border-verdict-retracted/50",
  medium: "text-verdict-wrong-source border-verdict-wrong-source/40",
  low: "text-muted-foreground border-border",
  none: "text-muted-foreground border-border",
};

export function ImportanceBadge({ importance }: { importance: Importance }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs whitespace-nowrap ${importanceColours[importance]}`}
    >
      {importanceLabels[importance]}
    </span>
  );
}
