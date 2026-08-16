import type { RunStage } from "../schemas/run";

export type ActivityLevel = "info" | "warning" | "problem" | "success";

export interface StageChangedEvent {
  type: "stage-changed";
  stage: RunStage;
  label: string;
  completedStages: number;
  totalStages: number;
}

export interface AgentStartedEvent {
  type: "agent-started";
  agentName: string;
  agentLabel: string;
  subject: string;
  stage: RunStage;
}

export interface AgentThinkingEvent {
  type: "agent-thinking";
  agentName: string;
  subject: string;
  text: string;
}

export interface AgentFinishedEvent {
  type: "agent-finished";
  agentName: string;
  agentLabel: string;
  subject: string;
  conclusion: string;
  level: ActivityLevel;
  durationMilliseconds: number;
}

export interface ToolUsedEvent {
  type: "tool-used";
  toolName: string;
  toolLabel: string;
  agentName: string | null;
  status: string;
  servedFromCache: boolean;
}

export interface ActivityEvent {
  type: "activity";
  level: ActivityLevel;
  message: string;
  detail: string | null;
}

export interface SpendUpdatedEvent {
  type: "spend-updated";
  totalDollars: number;
  tokensIn: number;
  tokensOut: number;
  activeAgentCount: number;
}

export interface RunFinishedEvent {
  type: "run-finished";
  runIdentifier: string;
  status: string;
  durationMilliseconds: number;
}

export interface RunStoredEvent {
  type: "run-stored";
  documentId: string;
  reportId: string;
  isFirstReport: boolean;
}

export interface RunFailedEvent {
  type: "run-failed";
  runIdentifier: string;
  message: string;
  isRecoverable: boolean;
}

export interface ProjectStartedEvent {
  type: "project-started";
  projectId: string;
  question: string;
}

export interface ProjectGateEvent {
  type: "project-gate";
  projectId: string;
  stage: string;
  heading: string;
  message: string;
}

export interface ProjectFinishedEvent {
  type: "project-finished";
  projectId: string;
  stage: string;
  draftId: string | null;
}

export type RunEvent =
  | ProjectStartedEvent
  | ProjectGateEvent
  | ProjectFinishedEvent
  | StageChangedEvent
  | AgentStartedEvent
  | AgentThinkingEvent
  | AgentFinishedEvent
  | ToolUsedEvent
  | ActivityEvent
  | SpendUpdatedEvent
  | RunFinishedEvent
  | RunStoredEvent
  | RunFailedEvent;

export type RunEventType = RunEvent["type"];

export interface RunEventWriter {
  emit: (event: RunEvent) => void;
}
