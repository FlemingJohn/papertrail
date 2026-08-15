import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "../config/environment";
import * as schema from "./schema";

type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

let cachedClient: DatabaseClient | null = null;

let cachedConnection: ReturnType<typeof postgres> | null = null;

export function getDatabase(): DatabaseClient {
  if (cachedClient !== null) {
    return cachedClient;
  }

  const environment = getServerEnvironment();

  if (environment.DATABASE_URL === undefined) {
    throw new Error(
      "DATABASE_URL is not set, so reports cannot be stored and papers cannot be watched. Checking a paper still works."
    );
  }

  cachedConnection = postgres(environment.DATABASE_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  cachedClient = drizzle(cachedConnection, { schema });
  return cachedClient;
}

export function isDatabaseConfigured(): boolean {
  try {
    getServerEnvironment();
    return true;
  } catch {
    return false;
  }
}
