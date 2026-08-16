import type { RunEvent } from "../types/stream";
import { encodeFrame } from "../runs/stream-protocol";

export function streamProjectEvents(
  events: AsyncGenerator<RunEvent>,
  projectId: string
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeFrame({ event, report: null })));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeFrame({
              event: {
                type: "run-failed",
                runIdentifier: projectId,
                message:
                  error instanceof Error
                    ? error.message
                    : "This step stopped unexpectedly.",
                isRecoverable: true,
              },
              report: null,
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Project-Identifier": projectId,
    },
  });
}
