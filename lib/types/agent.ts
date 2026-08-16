import type { z } from "zod";
import type { RunStage } from "../schemas/run";
import type { Outcome } from "./failure";
import type { RunEventWriter } from "./stream";

export type ModelTier = "standard";

export interface AgentDefinition<OutputSchema extends z.ZodType> {
  name: string;
  label: string;
  stage: RunStage;
  buildSystemPrompt: () => string;
  outputSchema: OutputSchema;
  toolNames: readonly string[];
  temperature: number;
  maximumRetries: number;
}

export interface AgentRunOptions {
  runIdentifier: string;
  subject: string;
  userPrompt: string;
  writer: RunEventWriter | null;
}

export interface AgentResult<Output> {
  output: Output;
  tokensIn: number;
  tokensOut: number;
  cachedTokensIn: number;
  durationMilliseconds: number;
}

export type AgentRunner<Output> = (
  options: AgentRunOptions
) => Promise<Outcome<AgentResult<Output>>>;
