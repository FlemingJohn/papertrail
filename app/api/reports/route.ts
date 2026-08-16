import { listReports, summariseUsage } from "@/lib/tools/database/list-reports";

export const runtime = "nodejs";

const toolContext = {
  runIdentifier: null,
  nodeName: "reports-api",
  agentName: null,
};

export async function GET(request: Request): Promise<Response> {
  const wantsUsage = new URL(request.url).searchParams.get("view") === "usage";

  const outcome = wantsUsage
    ? await summariseUsage.run({}, toolContext)
    : await listReports.run({ limit: 50 }, toolContext);

  if (!outcome.successful) {
    return Response.json(
      {
        error: wantsUsage
          ? "Usage totals could not be read. Check that the database is reachable."
          : "Past reports could not be read. Check that the database is reachable.",
        detail: outcome.failure.message,
      },
      { status: 503 }
    );
  }

  return Response.json(outcome.value);
}
