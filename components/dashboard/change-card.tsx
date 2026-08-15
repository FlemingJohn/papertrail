import type { DetectedChange, Importance } from "@/lib/schemas/watch";
import { changeKindLabels, importanceLabels } from "@/lib/config/labels";
import { microLabel, pill } from "@/lib/design/tokens";
import { ArrowRightIcon } from "./icons";

const seriousKinds: ReadonlyArray<DetectedChange["kind"]> = [
  "source-retracted",
  "combined-result-shifted",
];

export function ChangeCard({ change }: { change: DetectedChange }) {
  const isSerious = seriousKinds.includes(change.kind);

  return (
    <article
      className={`border-l pl-5 ${
        isSerious ? "border-verdict-retracted/60" : "border-white/15"
      }`}
    >
      <p
        className={`${microLabel} mb-3 ${
          isSerious ? "text-verdict-retracted" : ""
        }`}
      >
        {changeKindLabels[change.kind]}
      </p>

      <p className="mb-4 max-w-2xl font-display text-lg font-light leading-snug">
        {change.headline}
      </p>

      {change.previousValue === null && change.currentValue === null ? null : (
        <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="text-muted-foreground line-through">
            {change.previousValue ?? "not present"}
          </span>
          <ArrowRightIcon className="size-3.5 text-muted-foreground" />
          <span>{change.currentValue ?? "not present"}</span>
        </div>
      )}

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {change.cause}
      </p>

      {change.affectedClaimIdentifiers.length === 0 ? null : (
        <p className={`${microLabel} mt-3`}>
          Affects {change.affectedClaimIdentifiers.join(", ")}
        </p>
      )}
    </article>
  );
}

const importanceColours: Record<Importance, string> = {
  high: "text-verdict-retracted border-verdict-retracted/60",
  medium: "text-verdict-wrong-source border-verdict-wrong-source/50",
  low: "text-muted-foreground border-white/20",
  none: "text-muted-foreground border-white/20",
};

export function ImportanceBadge({ importance }: { importance: Importance }) {
  return (
    <span className={`${pill} ${importanceColours[importance]}`}>
      {importanceLabels[importance]}
    </span>
  );
}
