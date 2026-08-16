import {
  listDrafts,
  listGaps,
  listProjectPapers,
  listProposals,
  readProject,
} from "@/lib/projects/store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const { projectId } = await context.params;

  try {
    const project = await readProject(projectId);

    if (project === null) {
      return Response.json(
        { error: "That project does not exist." },
        { status: 404 }
      );
    }

    const [papers, gaps, proposals, drafts] = await Promise.all([
      listProjectPapers(projectId),
      listGaps(projectId),
      listProposals(projectId),
      listDrafts(projectId),
    ]);

    return Response.json({
      project,
      papers,
      gaps,
      proposals,
      drafts: drafts.map((draft) => ({
        draftId: draft.draftId,
        title: draft.title,
        authorName: draft.authorName,
        figureCount: draft.figureCount,
        tableCount: draft.tableCount,
        excludedCitations: draft.excludedCitations,
        createdAt: draft.createdAt,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `This project could not be loaded: ${error.message}`
            : "This project could not be loaded.",
      },
      { status: 500 }
    );
  }
}
