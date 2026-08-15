import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Report } from "../schemas/report";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  digitalObjectIdentifier: text("digital_object_identifier"),
  pageCount: integer("page_count").notNull().default(1),
  storagePath: text("storage_path"),
  contentFingerprint: text("content_fingerprint").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("running"),
    depth: text("depth").notNull().default("standard"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    costDollars: numeric("cost_dollars", { precision: 12, scale: 6 })
      .notNull()
      .default("0"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [index("runs_document_started_index").on(table.documentId, table.startedAt)]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    payload: jsonb("payload").$type<Report>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reports_document_created_index").on(table.documentId, table.createdAt),
  ]
);

export const watches = pgTable("watches", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .unique()
    .references(() => documents.id, { onDelete: "cascade" }),
  frequency: text("frequency").notNull().default("monthly"),
  notifyFrom: text("notify_from").notNull().default("medium"),
  isPaused: boolean("is_paused").notNull().default(false),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  nextCheckAt: timestamp("next_check_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const watchChecks = pgTable(
  "watch_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    watchId: uuid("watch_id")
      .notNull()
      .references(() => watches.id, { onDelete: "cascade" }),
    previousReportId: uuid("previous_report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    currentReportId: uuid("current_report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    importance: text("importance").notNull(),
    shouldNotify: boolean("should_notify").notNull().default(false),
    explanation: text("explanation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("watch_checks_watch_created_index").on(table.watchId, table.createdAt),
  ]
);

export const detectedChanges = pgTable("detected_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchCheckId: uuid("watch_check_id")
    .notNull()
    .references(() => watchChecks.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  headline: text("headline").notNull(),
  previousValue: text("previous_value"),
  currentValue: text("current_value"),
  cause: text("cause").notNull(),
  affectedClaimIdentifiers: text("affected_claim_identifiers")
    .array()
    .notNull()
    .default([]),
});

export const toolCalls = pgTable(
  "tool_calls",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    runId: uuid("run_id").references(() => runs.id, { onDelete: "cascade" }),
    nodeName: text("node_name").notNull(),
    agentName: text("agent_name"),
    toolName: text("tool_name").notNull(),
    inputFingerprint: text("input_fingerprint").notNull(),
    status: text("status").notNull(),
    latencyMilliseconds: integer("latency_milliseconds").notNull().default(0),
    servedFromCache: boolean("served_from_cache").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("tool_calls_run_index").on(table.runId)]
);
