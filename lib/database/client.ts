import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "../config/environment";
import * as schema from "./schema";

type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

type Connection = ReturnType<typeof postgres>;

interface DatabaseHolder {
  client: DatabaseClient | null;
  connection: Connection | null;
}

const holderKey = Symbol.for("papertrail.database");

const globalStore = globalThis as unknown as Record<symbol, DatabaseHolder>;

function readHolder(): DatabaseHolder {
  const existing = globalStore[holderKey];

  if (existing !== undefined) {
    return existing;
  }

  const created: DatabaseHolder = { client: null, connection: null };
  globalStore[holderKey] = created;
  return created;
}

export function getDatabase(): DatabaseClient {
  const holder = readHolder();

  if (holder.client !== null) {
    return holder.client;
  }

  const environment = getServerEnvironment();

  if (environment.DATABASE_URL === undefined) {
    throw new Error(
      "DATABASE_URL is not set, so reports cannot be stored and papers cannot be watched. Checking a paper still works."
    );
  }

  holder.connection = postgres(environment.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: {
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 15000,
    },
  });

  holder.client = drizzle(holder.connection, { schema });
  return holder.client;
}

export function isDatabaseConfigured(): boolean {
  try {
    getServerEnvironment();
    return true;
  } catch {
    return false;
  }
}
