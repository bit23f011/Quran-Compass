-- Optional Supabase cloud backup. Run in your project's SQL editor.
create table if not exists public.compass_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint compass_payload_size check (octet_length(payload::text) <= 5242880),
  constraint compass_payload_format check (payload->>'format' = 'surah-compass-backup-v2')
);
alter table public.compass_backups enable row level security;
revoke all on public.compass_backups from anon;
grant select, insert, update, delete on public.compass_backups to authenticated;
create policy "Read own compass backup" on public.compass_backups for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own compass backup" on public.compass_backups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own compass backup" on public.compass_backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own compass backup" on public.compass_backups for delete to authenticated using ((select auth.uid()) = user_id);
