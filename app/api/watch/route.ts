import { z } from "zod";
import { importanceSchema, watchFrequencySchema } from "@/lib/schemas/watch";
import { listWatches } from "@/lib/tools/database/list-watches";
import { saveWatch } from "@/lib/tools/database/save-watch";

export const runtime = "nodejs";

const toolContext = {
  runIdentifier: null,
  nodeName: "watch-api",
  agentName: null,
};

const createWatchSchema = z.object({
  documentId: z.uuid(),
  frequency: watchFrequencySchema.default("monthly"),
  notifyFrom: importanceSchema.default("medium"),
});

export async function GET(): Promise<Response> {
  const outcome = await listWatches.run({}, toolContext);

  if (!outcome.successful) {
    return Response.json(
      {
        error:
          "The watch list could not be read. Check that the database is reachable.",
        detail: outcome.failure.message,
      },
      { status: 503 }
    );
  }

  return Response.json(outcome.value);
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "The request body was not valid JSON." },
      { status: 400 }
    );
  }

  const parsed = createWatchSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "The watch settings were not in the expected shape.",
        detail: parsed.error.issues
          .map((issue) => `${issue.path.join(".")} ${issue.message}`)
          .join("; "),
      },
      { status: 400 }
    );
  }

  const outcome = await saveWatch.run(
    {
      documentId: parsed.data.documentId,
      frequency: parsed.data.frequency,
      notifyFrom: parsed.data.notifyFrom,
      isPaused: false,
    },
    toolContext
  );

  if (!outcome.successful) {
    return Response.json(
      {
        error: "The watch could not be saved.",
        detail: outcome.failure.message,
      },
      { status: 503 }
    );
  }

  return Response.json(outcome.value, { status: 201 });
}
