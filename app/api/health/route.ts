import { getServerEnvironment } from "@/lib/config/environment";
import { summariseUsage } from "@/lib/tools/database/list-reports";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  let modelName = "not configured";

  try {
    modelName = getServerEnvironment().AZURE_OPENAI_DEPLOYMENT;
  } catch {
    return Response.json({
      modelName,
      totalDollars: null,
      runCount: null,
      isStoring: false,
    });
  }

  const usageOutcome = await summariseUsage.run(
    {},
    { runIdentifier: null, nodeName: "health", agentName: null }
  );

  return Response.json({
    modelName,
    totalDollars: usageOutcome.successful
      ? usageOutcome.value.totalDollars
      : null,
    runCount: usageOutcome.successful ? usageOutcome.value.runCount : null,
    isStoring: usageOutcome.successful,
  });
}
