import { readDocumentRecord } from "@/lib/tools/database/list-documents";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { documentId } = await context.params;

  const outcome = await readDocumentRecord.run(
    { documentId },
    { runIdentifier: null, nodeName: "documents-api", agentName: null }
  );

  if (!outcome.successful) {
    return Response.json(
      {
        error: "That paper could not be opened.",
        detail: outcome.failure.message,
      },
      { status: outcome.failure.code === "not-found" ? 404 : 503 }
    );
  }

  return Response.json(outcome.value);
}
