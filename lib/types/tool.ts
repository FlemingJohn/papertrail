import type { z } from "zod";
import type { Outcome } from "./failure";

export interface ToolContext {
  runIdentifier: string | null;
  nodeName: string;
  agentName: string | null;
}

export interface ToolDefinition<
  InputSchema extends z.ZodType,
  OutputSchema extends z.ZodType,
> {
  name: string;
  description: string;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  execute: (
    input: z.infer<InputSchema>,
    context: ToolContext
  ) => Promise<z.infer<OutputSchema>>;
  cacheSeconds?: number;
  timeoutMilliseconds?: number;
  retryAttempts?: number;
  availableToAgents?: boolean;
}

export interface RegisteredTool<
  InputSchema extends z.ZodType = z.ZodType,
  OutputSchema extends z.ZodType = z.ZodType,
> {
  name: string;
  description: string;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  availableToAgents: boolean;
  run: (
    input: z.infer<InputSchema>,
    context: ToolContext
  ) => Promise<Outcome<z.infer<OutputSchema>>>;
}

export interface ToolCallRecord {
  runIdentifier: string | null;
  nodeName: string;
  agentName: string | null;
  toolName: string;
  inputFingerprint: string;
  status: string;
  latencyMilliseconds: number;
  servedFromCache: boolean;
}
