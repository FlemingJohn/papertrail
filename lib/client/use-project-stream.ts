"use client";

import { useCallback, useRef, useState } from "react";
import type { ActivityLevel, RunEvent } from "@/lib/types/stream";
import { decodeFrames } from "@/lib/runs/stream-protocol";
import type { ActivityLine, AgentTrace } from "./use-run-stream";

export interface ProjectGate {
  stage: string;
  heading: string;
  message: string;
}

export interface ProjectStreamState {
  status: "idle" | "running" | "waiting" | "finished" | "failed";
  projectId: string | null;
  stageLabel: string;
  completedStages: number;
  totalStages: number;
  agents: AgentTrace[];
  activity: ActivityLine[];
  spendDollars: number;
  gate: ProjectGate | null;
  draftId: string | null;
  errorMessage: string | null;
}

const initialState: ProjectStreamState = {
  status: "idle",
  projectId: null,
  stageLabel: "Waiting to start",
  completedStages: 0,
  totalStages: 3,
  agents: [],
  activity: [],
  spendDollars: 0,
  gate: null,
  draftId: null,
  errorMessage: null,
};

const maximumActivityLines = 120;

const maximumAgentTraces = 30;

export function useProjectStream() {
  const [state, setState] = useState<ProjectStreamState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sequenceRef.current = 0;
    setState(initialState);
  }, []);

  const send = useCallback(
    async (path: string, body: unknown): Promise<void> => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      sequenceRef.current = 0;

      setState({ ...initialState, status: "running" });

      let response: Response;

      try {
        response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
        const failure = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setState((current) => ({
          ...current,
          status: "failed",
          errorMessage: failure?.error ?? "This step could not be started.",
        }));
        return;
      }

      const projectId = response.headers.get("X-Project-Identifier");

      if (projectId !== null) {
        setState((current) => ({ ...current, projectId }));
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
            setState((current) => applyFrame(current, frame.event, sequence));
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

  return { state, send, reset };
}

function applyFrame(
  current: ProjectStreamState,
  event: RunEvent,
  sequence: number
): ProjectStreamState {
  switch (event.type) {
    case "project-started":
      return { ...current, projectId: event.projectId };

    case "stage-changed":
      return {
        ...current,
        stageLabel: event.label,
        completedStages: event.completedStages,
        totalStages: event.totalStages,
      };

    case "project-gate":
      return {
        ...current,
        status: "waiting",
        gate: {
          stage: event.stage,
          heading: event.heading,
          message: event.message,
        },
      };

    case "project-finished":
      return {
        ...current,
        status: event.stage === "finished" ? "finished" : "waiting",
        draftId: event.draftId,
        completedStages: current.totalStages,
      };

    case "run-failed":
      return { ...current, status: "failed", errorMessage: event.message };

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

    case "activity":
      return {
        ...current,
        activity: [
          {
            key: `activity-${sequence}`,
            level: event.level,
            message: event.message,
            detail: event.detail,
            at: Date.now(),
          },
          ...current.activity,
        ].slice(0, maximumActivityLines),
      };

    case "spend-updated":
      return { ...current, spendDollars: event.totalDollars };

    default:
      return current;
  }
}
