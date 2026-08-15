import { findWatchHistory } from "@/lib/tools/database/find-watch-history";
import { stopWatch } from "@/lib/tools/database/save-watch";

export const runtime = "nodejs";

const toolContext = {
  runIdentifier: null,
  nodeName: "watch-api",
  agentName: null,
};

interface RouteContext {
  params: Promise<{ watchId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { watchId } = await context.params;

  const outcome = await findWatchHistory.run({ watchId, limit: 20 }, toolContext);

  if (!outcome.successful) {
    return Response.json(
      {
        error: "The check history could not be read.",
        detail: outcome.failure.message,
      },
      { status: outcome.failure.code === "invalid-input" ? 400 : 503 }
    );
  }

  return Response.json(outcome.value);
}

export async function DELETE(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { watchId } = await context.params;

  const outcome = await stopWatch.run({ watchId }, toolContext);

  if (!outcome.successful) {
    return Response.json(
      {
        error: "The watch could not be removed.",
        detail: outcome.failure.message,
      },
      { status: outcome.failure.code === "invalid-input" ? 400 : 503 }
    );
  }

  return Response.json(outcome.value);
}
