-- pilot-feedback.sql — نفّذه في Supabase SQL Editor (مرة واحدة)
create table if not exists pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  device_id text not null default '',
  name text not null default '',
  stage text not null default '',
  page text not null default '',
  rating integer not null default 0,
  likes text not null default '',
  issues text not null default '',
  ideas text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists pilot_feedback_created_idx on pilot_feedback (created_at desc);
alter table pilot_feedback enable row level security;
drop policy if exists "anon_all_feedback" on pilot_feedback;
create policy "anon_all_feedback" on pilot_feedback for all to anon using (true) with check (true);
