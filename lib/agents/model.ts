import { AzureChatOpenAI } from "@langchain/openai";
import {
  getAzureOpenAiBasePath,
  getServerEnvironment,
} from "../config/environment";

const modelCache = new Map<number, AzureChatOpenAI>();

export function getModel(temperature: number): AzureChatOpenAI {
  const cached = modelCache.get(temperature);

  if (cached !== undefined) {
    return cached;
  }

  const environment = getServerEnvironment();

  const model = new AzureChatOpenAI({
    azureOpenAIApiKey: environment.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: environment.AZURE_OPENAI_API_VERSION,
    azureOpenAIApiDeploymentName: environment.AZURE_OPENAI_DEPLOYMENT,
    azureOpenAIBasePath: getAzureOpenAiBasePath(),
    temperature,
    maxRetries: 2,
    timeout: 120000,
    streaming: true,
    streamUsage: true,
  });

  modelCache.set(temperature, model);
  return model;
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
