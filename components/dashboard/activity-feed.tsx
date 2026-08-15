"use client";

import type { ActivityLine } from "@/lib/client/use-run-stream";
import { CheckIcon, InfoIcon, ProblemIcon, WarningIcon } from "./icons";

interface ActivityFeedProps {
  lines: ActivityLine[];
}

export function ActivityFeed({ lines }: ActivityFeedProps) {
  if (lines.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Nothing has happened yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/30">
      {lines.map((line) => (
        <li key={line.key} className="flex gap-2.5 px-4 py-2">
          <LevelMark level={line.level} />
          <div className="min-w-0">
            <p className="text-sm leading-snug text-foreground">
              {line.message}
            </p>
            {line.detail === null ? null : (
              <p className="font-mono text-xs leading-snug text-muted-foreground">
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
  return <InfoIcon className={`${className} text-muted-foreground/60`} />;
}
