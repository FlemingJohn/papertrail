import { z } from "zod";
import { importanceSchema, watchFrequencySchema } from "@/lib/schemas/watch";
import { runWatchCheck } from "@/lib/watch/run-watch-check";

export const runtime = "nodejs";

export const maxDuration = 120;

const checkRequestSchema = z.object({
  documentId: z.uuid(),
  frequency: watchFrequencySchema.default("monthly"),
  notifyFrom: importanceSchema.default("medium"),
});

interface RouteContext {
  params: Promise<{ watchId: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { watchId } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "The request body was not valid JSON." },
      { status: 400 }
    );
  }

  const parsed = checkRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "The check request was not in the expected shape.",
        detail: parsed.error.issues
          .map((issue) => `${issue.path.join(".")} ${issue.message}`)
          .join("; "),
      },
      { status: 400 }
    );
  }

  const outcome = await runWatchCheck({
    watchId,
    documentId: parsed.data.documentId,
    frequency: parsed.data.frequency,
    notifyFrom: parsed.data.notifyFrom,
    writer: null,
  });

  if (!outcome.successful) {
    return Response.json(
      {
        error: "The comparison could not be completed.",
        detail: outcome.failure.message,
      },
      { status: 503 }
    );
  }

  return Response.json(outcome.value);
}
