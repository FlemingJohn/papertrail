import createDocumentIntelligenceClient, {
  getLongRunningPoller,
  isUnexpected,
  type AnalyzeOperationOutput,
  type AnalyzeResultOutput,
  type DocumentIntelligenceClient,
} from "@azure-rest/ai-document-intelligence";
import { getServerEnvironment } from "../../config/environment";

let cachedClient: DocumentIntelligenceClient | null = null;

export function getDocumentClient(): DocumentIntelligenceClient {
  if (cachedClient !== null) {
    return cachedClient;
  }

  const environment = getServerEnvironment();

  cachedClient = createDocumentIntelligenceClient(
    environment.AZURE_DOCUMENT_ENDPOINT,
    { key: environment.AZURE_DOCUMENT_KEY }
  );

  return cachedClient;
}

export async function analyseLayout(
  base64Source: string
): Promise<AnalyzeResultOutput> {
  const client = getDocumentClient();

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
    .post({
      contentType: "application/json",
      body: { base64Source },
      queryParameters: { outputContentFormat: "markdown" },
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(
      `Document Intelligence rejected the file: ${initialResponse.body.error.message}`
    );
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const completed = (await poller.pollUntilDone()).body as AnalyzeOperationOutput;

  if (completed.status !== "succeeded" || completed.analyzeResult === undefined) {
    throw new Error(
      `Document Intelligence finished with status "${completed.status}"`
    );
  }

  return completed.analyzeResult;
}
