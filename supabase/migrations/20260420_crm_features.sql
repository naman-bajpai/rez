-- CRM features: client segmentation, tags, visit tracking, broadcast messaging

-- 1. Add CRM columns to clients
alter table clients
  add column if not exists tags          text[]         not null default '{}',
  add column if not exists total_visits  int            not null default 0,
  add column if not exists lifetime_spend numeric(10,2) not null default 0,
  add column if not exists no_show_count  int            not null default 0,
  add column if not exists cancellation_count int        not null default 0,
  add column if not exists birthday      date,
  add column if not exists churn_risk_score numeric(3,2);

-- 2. Broadcast messages (campaigns sent to client segments)
create table if not exists broadcast_messages (
  id             uuid        primary key default gen_random_uuid(),
  business_id    uuid        not null references businesses(id) on delete cascade,
  segment        text        not null check (segment in ('all','vip','lapsed','new','at_risk','custom')),
  channel        text        not null check (channel in ('sms','email')) default 'sms',
  message        text        not null,
  status         text        not null check (status in ('draft','sent','scheduled')) default 'draft',
  scheduled_at   timestamptz,
  sent_at        timestamptz,
  recipient_count int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 3. Per-recipient delivery tracking
create table if not exists broadcast_recipients (
  id           uuid        primary key default gen_random_uuid(),
  broadcast_id uuid        not null references broadcast_messages(id) on delete cascade,
  client_id    uuid        not null references clients(id) on delete cascade,
  status       text        not null check (status in ('queued','sent','failed','bounced')) default 'queued',
  sent_at      timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

-- 4. Indexes
create index if not exists idx_clients_tags              on clients using gin(tags);
create index if not exists idx_clients_biz_last_booked   on clients(business_id, last_booked_at desc nulls last);
create index if not exists idx_clients_birthday          on clients(birthday) where birthday is not null;
create index if not exists idx_clients_churn             on clients(business_id, churn_risk_score desc) where churn_risk_score is not null;
create index if not exists idx_broadcast_biz             on broadcast_messages(business_id, created_at desc);
create index if not exists idx_broadcast_recipients_bid  on broadcast_recipients(broadcast_id);

-- 5. Churn risk function (0.0 = engaged, 1.0 = churned)
create or replace function compute_churn_risk(
  p_last_booked_at        timestamptz,
  p_typical_frequency_days int,
  p_no_show_count         int,
  p_total_visits          int
) returns numeric as $$
declare
  days_since int;
  freq       int;
  risk       numeric;
begin
  if p_last_booked_at is null then return 0.5; end if;

  days_since := extract(epoch from (now() - p_last_booked_at))::int / 86400;
  freq       := coalesce(p_typical_frequency_days, 45);

  -- Base: how far past their typical return window are they?
  risk := least(1.0, greatest(0.0,
    (days_since::numeric / (freq * 2.0)) - 0.5
  ));

  -- Each no-show adds risk, capped at +0.3
  risk := least(1.0, risk + least(0.3, coalesce(p_no_show_count, 0) * 0.1));

  -- New clients (< 2 visits) are discounted — not enough data to call them at-risk
  if coalesce(p_total_visits, 0) < 2 then
    risk := risk * 0.6;
  end if;

  return round(risk, 2);
end;
$$ language plpgsql immutable;

-- 6. View: clients with computed segment label
create or replace view client_segments as
select
  c.*,
  compute_churn_risk(
    c.last_booked_at,
    c.typical_frequency_days,
    c.no_show_count,
    c.total_visits
  ) as computed_churn_risk,
  case
    when 'vip' = any(c.tags)
      then 'vip'
    when c.total_visits >= 8 or c.lifetime_spend >= 500
      then 'vip'
    when c.last_booked_at is null or c.last_booked_at < now() - interval '60 days'
      then 'lapsed'
    when c.created_at > now() - interval '30 days' and coalesce(c.total_visits, 0) <= 1
      then 'new'
    when compute_churn_risk(c.last_booked_at, c.typical_frequency_days, c.no_show_count, c.total_visits) >= 0.7
      then 'at_risk'
    else 'active'
  end as segment
from clients c;

-- 7. Helper: backfill total_visits + lifetime_spend from bookings
-- Run once after deploying; bookings trigger will keep it current going forward.
-- Example (adjust status values to match your schema):
--
-- update clients c set
--   total_visits   = b.visits,
--   lifetime_spend = b.spend
-- from (
--   select client_id,
--     count(*) filter (where status = 'confirmed')            as visits,
--     coalesce(sum(price) filter (where status = 'confirmed'), 0) as spend
--   from bookings
--   group by client_id
-- ) b
-- where c.id = b.client_id;
