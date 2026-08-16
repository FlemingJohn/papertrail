import { z } from "zod";
import { decisionSchema } from "@/lib/schemas/project";
import { readProject, recordGapDecisions } from "@/lib/projects/store";
import { runProposals } from "@/lib/projects/run-proposals";
import { streamProjectEvents } from "@/lib/projects/stream-response";

export const runtime = "nodejs";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const decideSchema = z.object({
  decisions: z
    .array(z.object({ gapId: z.uuid(), decision: decisionSchema }))
    .min(1),
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

  const parsed = decideSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Send a decision for each opening you looked at." },
      { status: 400 }
    );
  }

  if (!parsed.data.decisions.some((entry) => entry.decision === "accepted")) {
    return Response.json(
      {
        error:
          "Accept at least one opening. Nothing can be proposed without one.",
      },
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

    await recordGapDecisions(projectId, parsed.data.decisions);

    return streamProjectEvents(
      runProposals({ projectId, question: project.question }),
      projectId
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Your decisions were not saved: ${error.message}`
            : "Your decisions were not saved.",
      },
      { status: 500 }
    );
  }
}
