alter table businesses
  add column if not exists ig_username             text,
  add column if not exists ai_context              text,
  add column if not exists ai_context_synced_at    timestamptz;
