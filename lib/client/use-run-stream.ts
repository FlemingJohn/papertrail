"use client";

import { useCallback, useRef, useState } from "react";
import type { Report } from "@/lib/schemas/report";
import type { RunDepth, RunStage } from "@/lib/schemas/run";
import type { ActivityLevel, RunEvent } from "@/lib/types/stream";
import { decodeFrames } from "@/lib/runs/stream-protocol";

export interface ActivityLine {
  key: string;
  level: ActivityLevel;
  message: string;
  detail: string | null;
  at: number;
}

export interface AgentTrace {
  agentName: string;
  agentLabel: string;
  subject: string;
  thinking: string;
  conclusion: string | null;
  level: ActivityLevel;
  isRunning: boolean;
  startedAt: number;
}

export interface RunProgress {
  stage: RunStage | null;
  stageLabel: string;
  completedStages: number;
  totalStages: number;
}

export interface RunStreamState {
  status: "idle" | "running" | "finished" | "failed";
  progress: RunProgress;
  agents: AgentTrace[];
  activity: ActivityLine[];
  toolUses: number;
  spendDollars: number;
  tokensIn: number;
  tokensOut: number;
  activeAgentCount: number;
  report: Report | null;
  errorMessage: string | null;
}

const initialState: RunStreamState = {
  status: "idle",
  progress: {
    stage: null,
    stageLabel: "Waiting to start",
    completedStages: 0,
    totalStages: 9,
  },
  agents: [],
  activity: [],
  toolUses: 0,
  spendDollars: 0,
  tokensIn: 0,
  tokensOut: 0,
  activeAgentCount: 0,
  report: null,
  errorMessage: null,
};

const maximumActivityLines = 200;

const maximumAgentTraces = 40;

export function useRunStream() {
  const [state, setState] = useState<RunStreamState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((current) => ({ ...current, status: "idle" }));
  }, []);

  const start = useCallback(
    async (file: File, depth: RunDepth) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      sequenceRef.current = 0;

      setState({ ...initialState, status: "running" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("depth", depth);

      let response: Response;

      try {
        response = await fetch("/api/runs", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState((current) => ({
          ...current,
          status: "failed",
          errorMessage:
            error instanceof Error
              ? error.message
              : "The request could not be sent.",
        }));
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setState((current) => ({
          ...current,
          status: "failed",
          errorMessage: body?.error ?? "The analysis could not be started.",
        }));
        return;
      }

      if (response.body === null) {
        setState((current) => ({
          ...current,
          status: "failed",
          errorMessage: "The server sent no response body.",
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const { frames, remainder } = decodeFrames(buffer);
          buffer = remainder;

          for (const frame of frames) {
            sequenceRef.current += 1;
            const sequence = sequenceRef.current;
            setState((current) => applyFrame(current, frame.event, frame.report, sequence));
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState((current) => ({
          ...current,
          status: "failed",
          errorMessage:
            error instanceof Error
              ? error.message
              : "The connection was interrupted.",
        }));
      }
    },
    []
  );

  return { state, start, cancel };
}

function applyFrame(
  current: RunStreamState,
  event: RunEvent,
  report: Report | null,
  sequence: number
): RunStreamState {
  switch (event.type) {
    case "stage-changed":
      return {
        ...current,
        progress: {
          stage: event.stage,
          stageLabel: event.label,
          completedStages: event.completedStages,
          totalStages: event.totalStages,
        },
      };

    case "agent-started":
      return {
        ...current,
        agents: [
          {
            agentName: event.agentName,
            agentLabel: event.agentLabel,
            subject: event.subject,
            thinking: "",
            conclusion: null,
            level: "info" as ActivityLevel,
            isRunning: true,
            startedAt: Date.now(),
          },
          ...current.agents,
        ].slice(0, maximumAgentTraces),
      };

    case "agent-thinking":
      return {
        ...current,
        agents: current.agents.map((agent) =>
          agent.agentName === event.agentName &&
          agent.subject === event.subject &&
          agent.isRunning
            ? { ...agent, thinking: agent.thinking + event.text }
            : agent
        ),
      };

    case "agent-finished":
      return {
        ...current,
        agents: current.agents.map((agent) =>
          agent.agentName === event.agentName &&
          agent.subject === event.subject &&
          agent.isRunning
            ? {
                ...agent,
                isRunning: false,
                conclusion: event.conclusion,
                level: event.level,
              }
            : agent
        ),
      };

    case "tool-used":
      return {
        ...current,
        toolUses: current.toolUses + 1,
        activity: addActivity(current.activity, {
          key: `tool-${sequence}`,
          level: event.status === "failed" ? "warning" : "info",
          message: event.toolLabel,
          detail: event.servedFromCache ? "from cache" : null,
          at: Date.now(),
        }),
      };

    case "activity":
      return {
        ...current,
        activity: addActivity(current.activity, {
          key: `activity-${sequence}`,
          level: event.level,
          message: event.message,
          detail: event.detail,
          at: Date.now(),
        }),
      };

    case "spend-updated":
      return {
        ...current,
        spendDollars: event.totalDollars,
        tokensIn: event.tokensIn,
        tokensOut: event.tokensOut,
        activeAgentCount: event.activeAgentCount,
      };

    case "run-finished":
      return {
        ...current,
        status: "finished",
        report,
        agents: current.agents.map((agent) => ({ ...agent, isRunning: false })),
      };

    case "run-failed":
      return {
        ...current,
        status: "failed",
        errorMessage: event.message,
        agents: current.agents.map((agent) => ({ ...agent, isRunning: false })),
      };

    default:
      return current;
  }
}

function addActivity(
  lines: ActivityLine[],
  line: ActivityLine
): ActivityLine[] {
  return [line, ...lines].slice(0, maximumActivityLines);
}
