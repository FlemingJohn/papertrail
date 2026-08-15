"use client";

import { motion } from "framer-motion";
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
    <ol>
      {orderedRunStages.map((stage, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex && isRunning;
        const isComplete = index <= currentIndex && !isRunning;
        const number = String(index + 1).padStart(2, "0");

        return (
          <motion.li
            key={stage}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.03 }}
            className="flex items-center gap-3 border-b border-white/10 py-3 last:border-b-0"
            aria-current={isActive ? "step" : undefined}
          >
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
              {number}
            </span>

            <StageMark isDone={isDone || isComplete} isActive={isActive} />

            <span
              className={`text-sm ${
                isDone || isComplete
                  ? "text-foreground"
                  : isActive
                    ? "text-accent"
                    : "text-muted-foreground/50"
              }`}
            >
              {runStageLabels[stage]}
            </span>
          </motion.li>
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

  return <PendingIcon className="size-4 shrink-0 text-muted-foreground/30" />;
}
