import { readReport } from "@/lib/tools/database/list-reports";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { reportId } = await context.params;

  const outcome = await readReport.run({ reportId }, {
    runIdentifier: null,
    nodeName: "reports-api",
    agentName: null,
  });

  if (!outcome.successful) {
    return Response.json(
      {
        error: "That report could not be opened.",
        detail: outcome.failure.message,
      },
      { status: outcome.failure.code === "not-found" ? 404 : 503 }
    );
  }

  return Response.json(outcome.value);
}
