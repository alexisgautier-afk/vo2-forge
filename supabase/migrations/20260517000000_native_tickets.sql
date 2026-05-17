-- Add native ticket management columns
alter table tickets
  add column if not exists description text,
  add column if not exists priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  add column if not exists sprint text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists created_by uuid references auth.users(id);

-- Allow authenticated users to fully manage tickets (replacing service-role-only write)
drop policy if exists "Service role write tickets" on tickets;
create policy "Authenticated write tickets" on tickets
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- signoff: allow service role and anon to update (for public approve/reject flow)
drop policy if exists "Service role write signoff" on signoff_requests;
create policy "Service role write signoff" on signoff_requests
  for all using (auth.role() = 'service_role');
create policy "Authenticated write signoff" on signoff_requests
  for insert with check (auth.role() = 'authenticated');
create policy "Anon update signoff" on signoff_requests
  for update using (true);
