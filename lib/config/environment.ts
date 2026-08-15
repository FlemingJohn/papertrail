import { z } from "zod";

const serverEnvironmentSchema = z.object({
  AZURE_OPENAI_API_KEY: z.string().min(1),
  AZURE_OPENAI_ENDPOINT: z.url(),
  AZURE_OPENAI_API_VERSION: z.string().min(1),
  AZURE_OPENAI_DEPLOYMENT: z.string().min(1),
  AZURE_DOCUMENT_ENDPOINT: z.url(),
  AZURE_DOCUMENT_KEY: z.string().min(1),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  OPENALEX_CONTACT_EMAIL: z.email(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

let cachedEnvironment: ServerEnvironment | null = null;

export function getServerEnvironment(): ServerEnvironment {
  if (cachedEnvironment !== null) {
    return cachedEnvironment;
  }

  const parsed = serverEnvironmentSchema.safeParse({
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
    AZURE_DOCUMENT_ENDPOINT: process.env.AZURE_DOCUMENT_ENDPOINT,
    AZURE_DOCUMENT_KEY: process.env.AZURE_DOCUMENT_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENALEX_CONTACT_EMAIL: process.env.OPENALEX_CONTACT_EMAIL,
  });

  if (!parsed.success) {
    const missingKeys = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(
      `Missing or invalid environment variables: ${missingKeys}. Copy .env.example to .env.local and fill in the values.`
    );
  }

  cachedEnvironment = parsed.data;
  return cachedEnvironment;
}

export function getAzureOpenAiBasePath(): string {
  const environment = getServerEnvironment();
  const endpoint = environment.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  return `${endpoint}/openai/deployments`;
}
