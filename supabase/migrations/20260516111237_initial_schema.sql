create table agent_runs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  agent_type  text not null check (agent_type in ('coding', 'qa', 'pm', 'specs')),
  status      text not null default 'pending'
              check (status in ('pending', 'running', 'done', 'error')),
  ticket_id   text,
  ticket_name text,
  prompt      text not null,
  output      text,
  tokens_used integer default 0,
  triggered_by uuid references auth.users(id),
  error       text
);

create table agent_logs (
  id         bigserial primary key,
  run_id     uuid not null references agent_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  level      text not null default 'info' check (level in ('info', 'warn', 'error', 'success')),
  message    text not null
);

create table tickets (
  id          text primary key,
  name        text not null,
  status      text not null check (status in ('ready', 'in_progress', 'review', 'blocked')),
  assignee    text,
  url         text,
  updated_at  timestamptz not null default now()
);

create table signoff_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  feature_name text not null,
  description  text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  text,
  comment      text,
  reviewed_at  timestamptz,
  ticket_id    text
);

-- RLS
alter table agent_runs enable row level security;
create policy "Authenticated read" on agent_runs for select using (auth.role() = 'authenticated');
create policy "Authenticated insert" on agent_runs for insert with check (auth.role() = 'authenticated');
create policy "Service role full access" on agent_runs using (auth.role() = 'service_role');

alter table agent_logs enable row level security;
create policy "Authenticated read logs" on agent_logs for select using (auth.role() = 'authenticated');
create policy "Service role write logs" on agent_logs for insert with check (auth.role() = 'service_role');

alter table tickets enable row level security;
create policy "Authenticated read tickets" on tickets for select using (auth.role() = 'authenticated');
create policy "Service role write tickets" on tickets using (auth.role() = 'service_role');

alter table signoff_requests enable row level security;
create policy "Authenticated read signoff" on signoff_requests for select using (auth.role() = 'authenticated');
create policy "Anon read signoff" on signoff_requests for select using (true);
create policy "Service role write signoff" on signoff_requests using (auth.role() = 'service_role');
