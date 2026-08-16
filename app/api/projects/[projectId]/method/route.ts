import { z } from "zod";
import { readProject, setProjectStage } from "@/lib/projects/store";
import { runDraft } from "@/lib/projects/run-draft";
import { streamProjectEvents } from "@/lib/projects/stream-response";

export const runtime = "nodejs";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const approveSchema = z.object({
  isApproved: z.boolean(),
  authorName: z.string().min(2).max(120),
});

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { projectId } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "The request body was not valid JSON." },
      { status: 400 }
    );
  }

  const parsed = approveSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Approve the plan and give the name to put on the draft." },
      { status: 400 }
    );
  }

  try {
    const project = await readProject(projectId);

    if (project === null) {
      return Response.json(
        { error: "That project does not exist." },
        { status: 404 }
      );
    }

    if (!parsed.data.isApproved) {
      await setProjectStage(projectId, "awaiting-proposal-decision", "waiting");

      return Response.json({
        stage: "awaiting-proposal-decision",
        message:
          "The plan was sent back. Choose a different proposal, or reject them all and return to the openings.",
      });
    }

    return streamProjectEvents(
      runDraft({
        projectId,
        question: project.question,
        authorName: parsed.data.authorName,
      }),
      projectId
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `The draft could not be started: ${error.message}`
            : "The draft could not be started.",
      },
      { status: 500 }
    );
  }
}
