create table agent_personalisation (
  id uuid primary key default gen_random_uuid(),
  agent_type text unique, -- null = global, otherwise matches AgentType
  instructions text not null default '',
  files jsonb not null default '[]', -- [{name: string, content: string}]
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed one global row and one per agent so upserts are simple
insert into agent_personalisation (agent_type) values
  (null),
  ('ba'),
  ('coding'),
  ('qa'),
  ('pm'),
  ('specs')
on conflict (agent_type) do nothing;

alter table agent_personalisation enable row level security;

create policy "Authenticated read personalisation" on agent_personalisation
  for select using (auth.role() = 'authenticated');

create policy "Authenticated write personalisation" on agent_personalisation
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
