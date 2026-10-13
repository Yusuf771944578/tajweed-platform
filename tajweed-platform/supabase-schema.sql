-- supabase-schema.sql — نفّذه مرة واحدة في Supabase: SQL Editor ← New query ← لصق ← Run
-- الجداول مطابقة للمفاتيح المحلية الحالية (local-first)، والسياسات تسمح بالعمل المجهول عبر device_id

create table if not exists profiles (
  device_id text primary key,
  display_name text default '',
  xp_total integer not null default 0,
  streak integer not null default 0,
  rank text not null default 'مبتدئ',
  updated_at timestamptz not null default now()
);

create table if not exists progress (
  device_id text not null,
  node_id text not null,
  mastery numeric not null default 0,
  attempts integer not null default 0,
  best numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (device_id, node_id)
);
create index if not exists progress_node_idx on progress (node_id);

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  amount integer not null default 0,
  source text not null default 'app',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists xp_events_device_idx on xp_events (device_id, created_at desc);

create table if not exists mistakes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  question text not null default '',
  answer text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists mistakes_device_idx on mistakes (device_id, created_at desc);

-- تفعيل RLS + سياسات مفتوحة للمجهول عبر anon key (مناسبة لمرحلة التجربة؛ تُشدَّد عند الحسابات)
alter table profiles enable row level security;
alter table progress enable row level security;
alter table xp_events enable row level security;
alter table mistakes enable row level security;

drop policy if exists "anon_all_profiles" on profiles;
create policy "anon_all_profiles" on profiles for all to anon using (true) with check (true);

drop policy if exists "anon_all_progress" on progress;
create policy "anon_all_progress" on progress for all to anon using (true) with check (true);

drop policy if exists "anon_all_xp" on xp_events;
create policy "anon_all_xp" on xp_events for all to anon using (true) with check (true);

drop policy if exists "anon_all_mistakes" on mistakes;
create policy "anon_all_mistakes" on mistakes for all to anon using (true) with check (true);

-- ملاحظة الترقية لاحقاً: عند إضافة Auth، تُستبدل السياسات بـ auth.uid() وجدول ربط device↔user
