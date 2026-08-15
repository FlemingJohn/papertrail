import type { ReactNode } from "react";
import { sectionLabel } from "@/lib/design/tokens";

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
    <div className="border-t border-white/10 pt-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <span className={sectionLabel}>{label}</span>
      </div>
      <p
        className={`font-display text-5xl font-light leading-none tracking-tight ${toneColours[tone]}`}
      >
        {value}
      </p>
      {detail === undefined ? null : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}
    </div>
  );
}
