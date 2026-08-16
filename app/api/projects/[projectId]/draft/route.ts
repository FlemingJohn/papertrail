import { listDrafts, readDraft } from "@/lib/projects/store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { projectId } = await context.params;
  const requestedDraftId = new URL(request.url).searchParams.get("draftId");

  try {
    if (requestedDraftId !== null) {
      const draft = await readDraft(requestedDraftId);

      if (draft === null) {
        return Response.json(
          { error: "That draft does not exist." },
          { status: 404 }
        );
      }

      return Response.json({ draft });
    }

    const drafts = await listDrafts(projectId);

    if (drafts.length === 0) {
      return Response.json(
        { error: "This project has no draft yet." },
        { status: 404 }
      );
    }

    return Response.json({ draft: drafts[0] });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `The draft could not be loaded: ${error.message}`
            : "The draft could not be loaded.",
      },
      { status: 500 }
    );
  }
}
