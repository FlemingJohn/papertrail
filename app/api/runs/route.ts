import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ParsedDocument } from "@/lib/schemas/document";
import { runDepthSchema, runDepthSettings } from "@/lib/schemas/run";
import { executeRun } from "@/lib/runs/execute-run";
import { persistRun } from "@/lib/runs/persist-run";
import { encodeFrame } from "@/lib/runs/stream-protocol";
import { readDocumentRecord } from "@/lib/tools/database/list-documents";

export const runtime = "nodejs";

export const maxDuration = 300;

const startRequestSchema = z.object({
  documentId: z.uuid(),
  depth: runDepthSchema.default("standard"),
});

const toolContext = {
  runIdentifier: null,
  nodeName: "runs-api",
  agentName: null,
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return respond(400, "The request body was not valid JSON.");
  }

  const parsed = startRequestSchema.safeParse(body);

  if (!parsed.success) {
    return respond(
      400,
      "Send a documentId and a depth. Add the paper to your knowledge base first."
    );
  }

  const documentOutcome = await readDocumentRecord.run(
    { documentId: parsed.data.documentId },
    toolContext
  );

  if (!documentOutcome.successful) {
    return respond(
      404,
      `That paper is not in your knowledge base: ${documentOutcome.failure.message}`
    );
  }

  const paper = documentOutcome.value;

  if (paper.extractedContent === null) {
    return respond(
      409,
      "That paper has no stored reading, so it cannot be checked. Add it again."
    );
  }

  const settings = runDepthSettings[parsed.data.depth];
  const runIdentifier = randomUUID();
  const extraction: ParsedDocument = paper.extractedContent;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const iterator = executeRun({
          runIdentifier,
          documentIdentifier: paper.documentId,
          paperTitle: paper.title,
          base64Source: "",
          cachedDocument: extraction,
          depth: parsed.data.depth,
          comparisonPaperLimit: settings.comparisonPaperLimit,
          shouldTraceSources: parsed.data.depth !== "quick",
          shouldRunReview: settings.runReview,
        });

        for await (const frame of iterator) {
          controller.enqueue(
            encoder.encode(
              encodeFrame({ event: frame.event, report: frame.report })
            )
          );

          if (frame.report === null) {
            continue;
          }

          const stored = await persistRun({
            graphRunIdentifier: runIdentifier,
            documentId: paper.documentId,
            depth: parsed.data.depth,
            report: frame.report,
          });

          controller.enqueue(
            encoder.encode(
              encodeFrame(
                stored.successful
                  ? {
                      event: {
                        type: "run-stored",
                        documentId: paper.documentId,
                        reportId: stored.value.reportId,
                        isFirstReport: stored.value.isFirstReport,
                      },
                      report: null,
                    }
                  : {
                      event: {
                        type: "activity",
                        level: "warning",
                        message: "The report was not saved",
                        detail: `${stored.failure.message} The findings are complete, but this check cannot be compared against later ones.`,
                      },
                      report: null,
                    }
              )
            )
          );
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeFrame({
              event: {
                type: "run-failed",
                runIdentifier,
                message:
                  error instanceof Error
                    ? error.message
                    : "The analysis stopped unexpectedly.",
                isRecoverable: false,
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
      "X-Run-Identifier": runIdentifier,
    },
  });
}

function respond(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
