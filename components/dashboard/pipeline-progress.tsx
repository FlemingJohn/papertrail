"use client";

import type { RunStage } from "@/lib/schemas/run";
import { orderedRunStages, runStageLabels } from "@/lib/config/labels";
import { CheckIcon, PendingIcon, SpinnerIcon } from "./icons";

interface PipelineProgressProps {
  currentStage: RunStage | null;
  isRunning: boolean;
}

export function PipelineProgress({
  currentStage,
  isRunning,
}: PipelineProgressProps) {
  const currentIndex =
    currentStage === null ? -1 : orderedRunStages.indexOf(currentStage);

  return (
    <ol className="space-y-0.5">
      {orderedRunStages.map((stage, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex && isRunning;
        const isComplete = index <= currentIndex && !isRunning;

        return (
          <li
            key={stage}
            className="flex items-center gap-2.5 py-1.5 text-sm"
            aria-current={isActive ? "step" : undefined}
          >
            <StageMark
              isDone={isDone || isComplete}
              isActive={isActive}
            />
            <span
              className={
                isDone || isComplete
                  ? "text-foreground"
                  : isActive
                    ? "text-accent"
                    : "text-muted-foreground/60"
              }
            >
              {runStageLabels[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StageMark({
  isDone,
  isActive,
}: {
  isDone: boolean;
  isActive: boolean;
}) {
  if (isActive) {
    return <SpinnerIcon className="size-4 shrink-0 animate-spin text-accent" />;
  }

  if (isDone) {
    return <CheckIcon className="size-4 shrink-0 text-verdict-supported" />;
  }

  return <PendingIcon className="size-4 shrink-0 text-muted-foreground/40" />;
}
