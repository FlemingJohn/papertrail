import { z } from "zod";
import { chooseProposal, readProject } from "@/lib/projects/store";
import { runMethod } from "@/lib/projects/run-method";
import { streamProjectEvents } from "@/lib/projects/stream-response";

export const runtime = "nodejs";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const chooseSchema = z.object({
  proposalId: z.uuid(),
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

  const parsed = chooseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Choose one proposal to take forward." },
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

    await chooseProposal(projectId, parsed.data.proposalId);

    return streamProjectEvents(
      runMethod({ projectId, question: project.question }),
      projectId
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Your choice was not saved: ${error.message}`
            : "Your choice was not saved.",
      },
      { status: 500 }
    );
  }
}
