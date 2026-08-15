import type { Report } from "../schemas/report";
import type { RunEvent } from "../types/stream";

export interface StreamFrame {
  event: RunEvent;
  report: Report | null;
}

export function encodeFrame(frame: StreamFrame): string {
  return `${JSON.stringify(frame)}\n`;
}

export function decodeFrames(buffer: string): {
  frames: StreamFrame[];
  remainder: string;
} {
  const parts = buffer.split("\n");
  const remainder = parts.pop() ?? "";
  const frames: StreamFrame[] = [];

  for (const part of parts) {
    const trimmed = part.trim();

    if (trimmed.length === 0) {
      continue;
    }

    try {
      frames.push(JSON.parse(trimmed) as StreamFrame);
    } catch {
      continue;
    }
  }

  return { frames, remainder };
}
