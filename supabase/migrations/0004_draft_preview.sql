alter table project_drafts
  add column if not exists preview_html text not null default '';
