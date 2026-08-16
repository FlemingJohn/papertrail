import { createHash, randomUUID } from "node:crypto";
import { runDepthSchema, runDepthSettings } from "@/lib/schemas/run";
import { executeRun } from "@/lib/runs/execute-run";
import { persistRun } from "@/lib/runs/persist-run";
import { encodeFrame } from "@/lib/runs/stream-protocol";

export const runtime = "nodejs";

export const maxDuration = 300;

const maximumFileBytes = 20 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return respondWithError(
      400,
      "The upload could not be read. Send the PDF as multipart form data."
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return respondWithError(400, "No PDF was attached to the request.");
  }

  if (file.type !== "application/pdf") {
    return respondWithError(
      415,
      "Only PDF files can be analysed. Convert the document to PDF and try again."
    );
  }

  if (file.size > maximumFileBytes) {
    return respondWithError(
      413,
      "That PDF is larger than 20 MB. Try a version without embedded high resolution images."
    );
  }

  const depthResult = runDepthSchema.safeParse(
    formData.get("depth") ?? "standard"
  );

  if (!depthResult.success) {
    return respondWithError(
      400,
      "Depth must be one of quick, standard or deep."
    );
  }

  const settings = runDepthSettings[depthResult.data];

  let base64Source: string;
  let contentFingerprint: string;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    base64Source = bytes.toString("base64");
    contentFingerprint = createHash("sha256").update(bytes).digest("hex");
  } catch {
    return respondWithError(400, "The PDF could not be decoded.");
  }

  const runIdentifier = randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const iterator = executeRun({
          runIdentifier,
          documentIdentifier: randomUUID(),
          paperTitle: file.name.replace(/\.pdf$/i, ""),
          base64Source,
          depth: depthResult.data,
          comparisonPaperLimit: settings.comparisonPaperLimit,
          shouldTraceSources: depthResult.data !== "quick",
          shouldRunReview: settings.runReview,
        });

        for await (const frame of iterator) {
          controller.enqueue(encoder.encode(encodeFrame(frame)));

          if (frame.report === null) {
            continue;
          }

          const stored = await persistRun({
            graphRunIdentifier: runIdentifier,
            contentFingerprint,
            depth: depthResult.data,
            report: frame.report,
          });

          controller.enqueue(
            encoder.encode(
              encodeFrame(
                stored.successful
                  ? {
                      event: {
                        type: "run-stored",
                        documentId: stored.value.documentId,
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
                        detail: `${stored.failure.message} The findings above are complete, but this paper cannot be watched for changes until storage works.`,
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

function respondWithError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
