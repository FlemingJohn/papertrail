"use client";

import type { ActivityLine } from "@/lib/client/use-run-stream";
import { microLabel } from "@/lib/design/tokens";
import { CheckIcon, InfoIcon, ProblemIcon, WarningIcon } from "./icons";

interface ActivityFeedProps {
  lines: ActivityLine[];
}

export function ActivityFeed({ lines }: ActivityFeedProps) {
  if (lines.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nothing has happened yet.
      </p>
    );
  }

  return (
    <ul>
      {lines.map((line) => (
        <li
          key={line.key}
          className="flex gap-3 border-b border-white/10 py-3 last:border-b-0"
        >
          <LevelMark level={line.level} />
          <div className="min-w-0">
            <p className="text-sm leading-snug">{line.message}</p>
            {line.detail === null ? null : (
              <p className={`${microLabel} mt-1 normal-case tracking-wider`}>
                {line.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function LevelMark({ level }: { level: ActivityLine["level"] }) {
  const className = "size-4 shrink-0 translate-y-0.5";

  if (level === "problem") {
    return <ProblemIcon className={`${className} text-verdict-retracted`} />;
  }
  if (level === "warning") {
    return <WarningIcon className={`${className} text-verdict-wrong-source`} />;
  }
  if (level === "success") {
    return <CheckIcon className={`${className} text-verdict-supported`} />;
  }
  return <InfoIcon className={`${className} text-muted-foreground/50`} />;
}
