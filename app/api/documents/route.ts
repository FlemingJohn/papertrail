import { createHash } from "node:crypto";
import type { ParsedDocument } from "@/lib/schemas/document";
import { readDocument } from "@/lib/tools/azure/read-document";
import {
  findStoredExtraction,
  upsertDocument,
} from "@/lib/tools/database/upsert-document";
import { listDocuments } from "@/lib/tools/database/list-documents";

export const runtime = "nodejs";

export const maxDuration = 300;

const maximumFileBytes = 20 * 1024 * 1024;

const toolContext = {
  runIdentifier: null,
  nodeName: "documents-api",
  agentName: null,
};

export async function GET(): Promise<Response> {
  const outcome = await listDocuments.run({}, toolContext);

  if (!outcome.successful) {
    return Response.json(
      {
        error:
          "Your papers could not be read. Check that the database is reachable.",
        detail: outcome.failure.message,
      },
      { status: 503 }
    );
  }

  return Response.json(outcome.value);
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return respond(400, "The upload could not be read.");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return respond(400, "No PDF was attached to the request.");
  }

  if (file.type !== "application/pdf") {
    return respond(
      415,
      "Only PDF files can be added. Convert the document to PDF and try again."
    );
  }

  if (file.size > maximumFileBytes) {
    return respond(413, "That PDF is larger than 20 MB.");
  }

  let base64Source: string;
  let contentFingerprint: string;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    base64Source = bytes.toString("base64");
    contentFingerprint = createHash("sha256").update(bytes).digest("hex");
  } catch {
    return respond(400, "The PDF could not be decoded.");
  }

  const alreadyStored = await findStoredExtraction.run(
    { contentFingerprint },
    toolContext
  );

  if (alreadyStored.successful && alreadyStored.value.extractedContent !== null) {
    const existing = await upsertDocument.run(
      {
        title: alreadyStored.value.extractedContent.textBlocks[0]?.text ?? file.name,
        contentFingerprint,
        pageCount: alreadyStored.value.extractedContent.pageCount,
        digitalObjectIdentifier: null,
        extractedContent: alreadyStored.value.extractedContent,
      },
      toolContext
    );

    if (existing.successful) {
      return Response.json(
        {
          documentId: existing.value.documentId,
          wasAlreadyStored: true,
          pageCount: alreadyStored.value.extractedContent.pageCount,
        },
        { status: 200 }
      );
    }
  }

  const readOutcome = await readDocument.run({ base64Source }, toolContext);

  if (!readOutcome.successful) {
    return respond(
      502,
      `The PDF could not be read: ${readOutcome.failure.message}`
    );
  }

  const extraction = readOutcome.value;
  const title = readTitle(extraction) ?? file.name.replace(/\.pdf$/i, "");

  const stored = await upsertDocument.run(
    {
      title,
      contentFingerprint,
      pageCount: extraction.pageCount,
      digitalObjectIdentifier: null,
      extractedContent: extraction,
    },
    toolContext
  );

  if (!stored.successful) {
    return respond(
      503,
      `The paper was read but could not be saved: ${stored.failure.message}`
    );
  }

  return Response.json(
    {
      documentId: stored.value.documentId,
      wasAlreadyStored: !stored.value.wasCreated,
      pageCount: extraction.pageCount,
      title,
    },
    { status: 201 }
  );
}

function readTitle(extraction: ParsedDocument): string | null {
  const titled = extraction.textBlocks.find((block) => block.role === "title");

  if (titled !== undefined && titled.text.trim().length >= 8) {
    return titled.text.trim().slice(0, 300);
  }

  const firstReal = extraction.textBlocks.find(
    (block) => block.role === null && block.text.trim().length >= 8
  );

  return firstReal === undefined ? null : firstReal.text.trim().slice(0, 300);
}

function respond(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}
