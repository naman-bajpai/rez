-- AI usage logging + monthly budget settings

-- 1. Per-call usage log
create table if not exists ai_usage_logs (
  id                  uuid        primary key default gen_random_uuid(),
  business_id         uuid        not null references businesses(id) on delete cascade,
  model               text        not null,
  endpoint            text        not null,  -- 'instagram_dm' | 'web_chat' | 'booking_chat' | 'dashboard_ai' | 'post_booking'
  prompt_tokens       int         not null default 0,
  completion_tokens   int         not null default 0,
  total_tokens        int         not null default 0,
  estimated_cost_usd  numeric(10,6) not null default 0,
  created_at          timestamptz not null default now()
);

-- 2. Monthly budget cap on businesses
alter table businesses
  add column if not exists ai_monthly_budget_usd numeric(8,2) not null default 50.00;

-- 3. Indexes for the queries we run in the stats API
-- (business_id, created_at) covers all month-range and sparkline queries via .gte()
create index if not exists idx_ai_usage_biz_created
  on ai_usage_logs(business_id, created_at desc);

-- 4. Convenience view: current-month rollup per business
create or replace view ai_usage_current_month as
select
  business_id,
  sum(prompt_tokens)      as prompt_tokens,
  sum(completion_tokens)  as completion_tokens,
  sum(total_tokens)       as total_tokens,
  sum(estimated_cost_usd) as cost_usd,
  count(*)                as call_count
from ai_usage_logs
where date_trunc('month', created_at) = date_trunc('month', now())
group by business_id;

-- 5. Per-endpoint rollup for the current month
create or replace view ai_usage_by_endpoint as
select
  business_id,
  endpoint,
  model,
  sum(prompt_tokens)      as prompt_tokens,
  sum(completion_tokens)  as completion_tokens,
  sum(total_tokens)       as total_tokens,
  sum(estimated_cost_usd) as cost_usd,
  count(*)                as call_count
from ai_usage_logs
where date_trunc('month', created_at) = date_trunc('month', now())
group by business_id, endpoint, model;

-- ── Queries used by GET /api/settings/ai-usage ───────────────────────────────
--
-- 1. Monthly totals + budget:
--    select
--      coalesce(u.prompt_tokens, 0)     as prompt_tokens,
--      coalesce(u.completion_tokens, 0) as completion_tokens,
--      coalesce(u.total_tokens, 0)      as total_tokens,
--      coalesce(u.cost_usd, 0)          as cost_usd,
--      coalesce(u.call_count, 0)        as call_count,
--      b.ai_monthly_budget_usd          as budget_usd
--    from businesses b
--    left join ai_usage_current_month u on u.business_id = b.id
--    where b.id = :businessId;
--
-- 2. Endpoint breakdown:
--    select endpoint, model, prompt_tokens, completion_tokens, cost_usd, call_count
--    from ai_usage_by_endpoint
--    where business_id = :businessId
--    order by cost_usd desc;
--
-- 3. Daily cost sparkline (last 30 days):
--    select
--      date_trunc('day', created_at)::date as day,
--      sum(estimated_cost_usd)             as cost_usd,
--      sum(total_tokens)                   as tokens
--    from ai_usage_logs
--    where business_id = :businessId
--      and created_at >= now() - interval '30 days'
--    group by 1
--    order by 1;
