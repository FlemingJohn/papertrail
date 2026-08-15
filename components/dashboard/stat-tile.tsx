import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "good" | "warning" | "problem";
  icon?: ReactNode;
}

const toneColours = {
  neutral: "text-foreground",
  good: "text-verdict-supported",
  warning: "text-verdict-wrong-source",
  problem: "text-verdict-retracted",
} as const;

export function StatTile({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: StatTileProps) {
  return (
    <div className="border border-border/60 bg-card/40 px-4 py-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs tracking-wide uppercase">{label}</span>
      </div>
      <p className={`font-display text-4xl leading-none ${toneColours[tone]}`}>
        {value}
      </p>
      {detail === undefined ? null : (
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
