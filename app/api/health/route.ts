import { getServerEnvironment } from "@/lib/config/environment";
import { summariseUsage } from "@/lib/tools/database/list-reports";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  let hasModel = false;
  let hasDocumentReader = false;

  try {
    const environment = getServerEnvironment();
    hasModel = environment.AZURE_OPENAI_API_KEY.length > 0;
    hasDocumentReader = environment.AZURE_DOCUMENT_KEY.length > 0;
  } catch {
    return Response.json({
      model: false,
      documentReader: false,
      database: false,
      note: "Azure settings are missing, so no check can run.",
    });
  }

  const databaseOutcome = await summariseUsage.run(
    {},
    { runIdentifier: null, nodeName: "health", agentName: null }
  );

  return Response.json({
    model: hasModel,
    documentReader: hasDocumentReader,
    database: databaseOutcome.successful,
    note: databaseOutcome.successful
      ? null
      : "Reports will not be stored and papers cannot be watched.",
  });
}
