create extension if not exists "pgcrypto";

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  digital_object_identifier text,
  page_count integer not null default 1,
  storage_path text,
  content_fingerprint text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  status text not null default 'running',
  depth text not null default 'standard',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cost_dollars numeric(12, 6) not null default 0,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  error_message text
);

create index if not exists runs_document_started_index
  on runs (document_id, started_at desc);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  fingerprint text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_document_created_index
  on reports (document_id, created_at desc);

create table if not exists watches (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references documents(id) on delete cascade,
  frequency text not null default 'monthly',
  notify_from text not null default 'medium',
  is_paused boolean not null default false,
  last_checked_at timestamptz,
  next_check_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists watches_due_index
  on watches (next_check_at)
  where is_paused = false;

create table if not exists watch_checks (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid not null references watches(id) on delete cascade,
  previous_report_id uuid not null references reports(id) on delete cascade,
  current_report_id uuid not null references reports(id) on delete cascade,
  importance text not null,
  should_notify boolean not null default false,
  explanation text not null,
  created_at timestamptz not null default now()
);

create index if not exists watch_checks_watch_created_index
  on watch_checks (watch_id, created_at desc);

create table if not exists detected_changes (
  id uuid primary key default gen_random_uuid(),
  watch_check_id uuid not null references watch_checks(id) on delete cascade,
  kind text not null,
  headline text not null,
  previous_value text,
  current_value text,
  cause text not null,
  affected_claim_identifiers text[] not null default '{}'
);

create table if not exists tool_calls (
  id bigserial primary key,
  run_id uuid references runs(id) on delete cascade,
  node_name text not null,
  agent_name text,
  tool_name text not null,
  input_fingerprint text not null,
  status text not null,
  latency_milliseconds integer not null default 0,
  served_from_cache boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tool_calls_run_index on tool_calls (run_id);
