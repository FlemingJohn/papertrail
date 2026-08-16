alter table tool_calls
  add column if not exists project_id uuid references projects(id) on delete cascade;

create index if not exists tool_calls_project_index
  on tool_calls (project_id);
