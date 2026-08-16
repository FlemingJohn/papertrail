import type { ToolCallRecord } from "../types/tool";

type ToolCallListener = (record: ToolCallRecord) => void;

const listeners = new Set<ToolCallListener>();

const recentRecords: ToolCallRecord[] = [];

const maximumRecentRecords = 500;

const pendingWrites: ToolCallRecord[] = [];

const writeBatchSize = 25;

let isFlushing = false;

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

  if (record.runIdentifier !== null) {
    pendingWrites.push(record);
  }
}

export async function flushToolCalls(
  graphRunIdentifier: string,
  storedRunIdentifier: string
): Promise<void> {
  if (isFlushing) {
    return;
  }

  const batch = pendingWrites.filter(
    (record) => record.runIdentifier === graphRunIdentifier
  );

  if (batch.length === 0) {
    return;
  }

  for (const record of batch) {
    const position = pendingWrites.indexOf(record);
    if (position !== -1) {
      pendingWrites.splice(position, 1);
    }
  }

  isFlushing = true;

  try {
    const { getDatabase } = await import("../database/client");
    const { toolCalls } = await import("../database/schema");

    await getDatabase()
      .insert(toolCalls)
      .values(
        batch.map((record) => ({
          runId: storedRunIdentifier,
          nodeName: record.nodeName,
          agentName: record.agentName,
          toolName: record.toolName,
          inputFingerprint: record.inputFingerprint,
          status: record.status,
          latencyMilliseconds: record.latencyMilliseconds,
          servedFromCache: record.servedFromCache,
        }))
      );
  } catch {
    return;
  } finally {
    isFlushing = false;
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
