alter table public.availability
  add column if not exists unavailable_blocks jsonb not null default '[]'::jsonb;

create table if not exists public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  start_time text not null,
  end_time text not null,
  is_active boolean not null default true,
  unavailable_blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_overrides_time_check
    check (
      start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and start_time < end_time
    ),
  constraint availability_overrides_unique_date unique (business_id, date),
  constraint availability_overrides_blocks_array
    check (jsonb_typeof(unavailable_blocks) = 'array')
);

create index if not exists availability_overrides_business_date_idx
  on public.availability_overrides (business_id, date);

alter table public.availability_overrides enable row level security;
