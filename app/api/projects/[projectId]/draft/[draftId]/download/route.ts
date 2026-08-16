import { readDraft } from "@/lib/projects/store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ projectId: string; draftId: string }>;
}

const contentTypes: Record<string, string> = {
  tex: "application/x-tex; charset=utf-8",
  bib: "application/x-bibtex; charset=utf-8",
};

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { draftId } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "tex";

  if (format !== "tex" && format !== "bib") {
    return Response.json(
      { error: "Ask for the draft as tex or the bibliography as bib." },
      { status: 400 }
    );
  }

  try {
    const draft = await readDraft(draftId);

    if (draft === null) {
      return Response.json(
        { error: "That draft does not exist." },
        { status: 404 }
      );
    }

    const body = format === "tex" ? draft.latex : draft.bibtex;
    const fileName = format === "tex" ? `${makeFileStem(draft.title)}.tex` : "verified.bib";

    return new Response(body, {
      headers: {
        "Content-Type": contentTypes[format],
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `The download could not be prepared: ${error.message}`
            : "The download could not be prepared.",
      },
      { status: 500 }
    );
  }
}

function makeFileStem(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return cleaned.length === 0 ? "draft" : cleaned;
}
