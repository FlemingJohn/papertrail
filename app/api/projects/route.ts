import { startProjectSchema } from "@/lib/schemas/project";
import { createProject, listProjects } from "@/lib/projects/store";
import { runDiscovery } from "@/lib/projects/run-discovery";
import { streamProjectEvents } from "@/lib/projects/stream-response";

export const runtime = "nodejs";

export const maxDuration = 300;

export async function GET(): Promise<Response> {
  try {
    const found = await listProjects();
    return Response.json({ projects: found });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Your projects could not be loaded: ${error.message}`
            : "Your projects could not be loaded.",
      },
      { status: 500 }
    );
  }
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

  const parsed = startProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error:
          "Write the research question in at least twelve characters and choose how many papers to gather.",
      },
      { status: 400 }
    );
  }

  let projectId: string;

  try {
    projectId = await createProject(parsed.data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `The project could not be started: ${error.message}`
            : "The project could not be started.",
      },
      { status: 500 }
    );
  }

  return streamProjectEvents(
    runDiscovery({
      projectId,
      question: parsed.data.question,
      paperTarget: parsed.data.paperTarget,
    }),
    projectId
  );
}
