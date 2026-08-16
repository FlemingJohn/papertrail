import type { RunEvent, RunEventWriter } from "../types/stream";

export class EventStream implements RunEventWriter {
  private readonly pending: RunEvent[] = [];

  private waiting: (() => void) | null = null;

  private closed = false;

  emit(event: RunEvent): void {
    if (this.closed) {
      return;
    }

    this.pending.push(event);
    this.release();
  }

  close(): void {
    this.closed = true;
    this.release();
  }

  private release(): void {
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.();
  }

  async *drain(): AsyncGenerator<RunEvent> {
    while (true) {
      while (this.pending.length > 0) {
        yield this.pending.shift() as RunEvent;
      }

      if (this.closed) {
        return;
      }

      await new Promise<void>((resolve) => {
        this.waiting = resolve;
      });
    }
  }
}

export async function* streamWhileRunning(
  stream: EventStream,
  work: () => Promise<void>
): AsyncGenerator<RunEvent> {
  let failure: unknown = null;

  const running = work()
    .catch((error: unknown) => {
      failure = error;
    })
    .finally(() => {
      stream.close();
    });

  for await (const event of stream.drain()) {
    yield event;
  }

  await running;

  if (failure !== null) {
    throw failure;
  }
}
