import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { ActivityLevel, RunEvent, RunEventWriter } from "../types/stream";
import type { RunStage } from "../schemas/run";
import { orderedRunStages, runStageLabels } from "../config/labels";

export function buildEventWriter(
  config: LangGraphRunnableConfig
): RunEventWriter {
  return {
    emit: (event: RunEvent) => {
      const writer = config.writer;

      if (typeof writer !== "function") {
        return;
      }

      writer(event);
    },
  };
}

export function announceStage(writer: RunEventWriter, stage: RunStage): void {
  writer.emit({
    type: "stage-changed",
    stage,
    label: runStageLabels[stage],
    completedStages: orderedRunStages.indexOf(stage),
    totalStages: orderedRunStages.length,
  });
}

export function reportActivity(
  writer: RunEventWriter,
  level: ActivityLevel,
  message: string,
  detail: string | null = null
): void {
  writer.emit({ type: "activity", level, message, detail });
}

export function reportSpend(
  writer: RunEventWriter,
  totalDollars: number,
  tokensIn: number,
  tokensOut: number,
  activeAgentCount: number
): void {
  writer.emit({
    type: "spend-updated",
    totalDollars,
    tokensIn,
    tokensOut,
    activeAgentCount,
  });
}
