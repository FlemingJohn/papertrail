"use client";

import { supportLabels } from "@/lib/client/project-types";
import { pill } from "@/lib/design/tokens";

const toneBySupport: Record<string, string> = {
  grounded: "border-verdict-supported/50 text-verdict-supported",
  inferred: "border-verdict-wrong-source/50 text-verdict-wrong-source",
  speculative: "border-verdict-retracted/50 text-verdict-retracted",
};

export function SupportBadge({ support }: { support: string }) {
  return (
    <span
      className={`${pill} ${toneBySupport[support] ?? "border-white/20 text-muted-foreground"}`}
    >
      {supportLabels[support] ?? support}
    </span>
  );
}
