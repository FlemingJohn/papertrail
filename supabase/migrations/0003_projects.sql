create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  domain text not null default 'other',
  paper_target integer not null default 10,
  stage text not null default 'finding-papers',
  status text not null default 'running',
  cost_dollars numeric(12, 6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_created_index on projects (created_at desc);

create table if not exists project_papers (
  project_id uuid not null references projects(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  report_id uuid references reports(id) on delete set null,
  added_by text not null default 'search',
  added_at timestamptz not null default now(),
  primary key (project_id, document_id)
);

create index if not exists project_papers_project_index
  on project_papers (project_id);

create table if not exists project_gaps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  position integer not null default 0,
  support text not null default 'speculative',
  headline text not null,
  evidence text not null,
  decision text not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_gaps_project_index
  on project_gaps (project_id, position);

create table if not exists project_proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  summary text not null,
  components jsonb not null default '[]'::jsonb,
  novelty_verdict text not null default 'not-checked',
  works_searched integer not null default 0,
  prior_art jsonb not null default '[]'::jsonb,
  prior_art_note text,
  method jsonb,
  decision text not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_proposals_project_index
  on project_proposals (project_id, position);

create table if not exists project_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  proposal_id uuid references project_proposals(id) on delete set null,
  author_name text not null,
  title text not null,
  latex text not null,
  bibtex text not null,
  excluded_citations jsonb not null default '[]'::jsonb,
  figure_count integer not null default 0,
  table_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_drafts_project_index
  on project_drafts (project_id, created_at desc);
