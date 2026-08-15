import type { ToolCallRecord } from "../types/tool";

type ToolCallListener = (record: ToolCallRecord) => void;

const listeners = new Set<ToolCallListener>();

const recentRecords: ToolCallRecord[] = [];

const maximumRecentRecords = 500;

export function addToolCallListener(listener: ToolCallListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function recordToolCall(record: ToolCallRecord): Promise<void> {
  recentRecords.push(record);

  if (recentRecords.length > maximumRecentRecords) {
    recentRecords.shift();
  }

  for (const listener of listeners) {
    try {
      listener(record);
    } catch {
      continue;
    }
  }
}

export function getToolCallsForRun(runIdentifier: string): ToolCallRecord[] {
  return recentRecords.filter(
    (record) => record.runIdentifier === runIdentifier
  );
}

export function summariseToolCalls(runIdentifier: string): {
  totalCalls: number;
  cacheHits: number;
  failures: number;
} {
  const records = getToolCallsForRun(runIdentifier);

  return {
    totalCalls: records.length,
    cacheHits: records.filter((record) => record.servedFromCache).length,
    failures: records.filter(
      (record) => record.status !== "succeeded" && record.status !== "cache-hit"
    ).length,
  };
}
