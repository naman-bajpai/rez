-- Add Instagram page ID to businesses (links a Rez business to a Meta IG page)
alter table businesses
  add column if not exists ig_page_id text;

create index if not exists businesses_ig_page_id_idx on businesses (ig_page_id);

-- IG thread state — stores conversation history per client per business
create table if not exists ig_threads (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses (id) on delete cascade,
  ig_user_id    text not null,
  messages      jsonb not null default '[]',
  paused        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, ig_user_id)
);

create index if not exists ig_threads_business_user_idx on ig_threads (business_id, ig_user_id);

-- updated_at trigger for ig_threads
create trigger trg_ig_threads_updated_at
  before update on ig_threads
  for each row execute function set_updated_at();

-- Enable RLS (server uses service-role key which bypasses it)
alter table ig_threads enable row level security;
