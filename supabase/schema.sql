-- =========================================================================
-- FamilyPoints – Supabase Schema (MVP)
-- Führe dieses Skript einmalig im Supabase SQL-Editor deines Projekts aus:
-- Dashboard -> SQL Editor -> New query -> Inhalt einfügen -> Run
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Tabellen
-- -------------------------------------------------------------------------

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid references public.families (id) on delete set null,
  role text not null check (role in ('parent', 'child')),
  display_name text not null,
  current_point_balance int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.point_settings (
  family_id uuid primary key references public.families (id) on delete cascade,
  points_per_unit int not null default 100,
  euro_value numeric(10, 2) not null default 1.00
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  code text not null unique,
  child_display_name text,
  status text not null default 'pending' check (status in ('pending', 'used', 'expired')),
  used_by uuid references public.profiles (id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  description text,
  category text,
  points int not null default 0,
  repeat_type text not null default 'once' check (repeat_type in ('once', 'daily', 'weekly', 'monthly')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  completed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  point_price int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  points_spent int not null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  type text not null check (type in ('main', 'minor'))
);

create table if not exists public.grade_point_rules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  subject_type text not null check (subject_type in ('main', 'minor')),
  grade_1 int not null,
  grade_2 int not null,
  grade_3 int not null,
  grade_4 int not null,
  grade_5 int not null,
  grade_6 int not null,
  unique (family_id, subject_type)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  grade_value numeric(3, 1) not null,
  date date not null default current_date,
  points_awarded int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null,
  source_type text not null check (source_type in ('task', 'grade', 'reward', 'manual')),
  source_id uuid,
  reason text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Hilfsfunktionen (werden in RLS-Policies wiederverwendet)
-- -------------------------------------------------------------------------

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- -------------------------------------------------------------------------
-- Trigger: bei Registrierung automatisch Profil (und ggf. Familie) anlegen
-- Erwartet raw_user_meta_data: { role: 'parent'|'child', display_name, family_name? }
-- -------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'parent');
  v_display_name text := coalesce(new.raw_user_meta_data ->> 'display_name', 'Neues Mitglied');
  v_family_id uuid;
begin
  if v_role = 'parent' then
    insert into public.families (name)
    values (coalesce(new.raw_user_meta_data ->> 'family_name', 'Familie ' || v_display_name))
    returning id into v_family_id;

    insert into public.point_settings (family_id) values (v_family_id);

    insert into public.grade_point_rules (family_id, subject_type, grade_1, grade_2, grade_3, grade_4, grade_5, grade_6)
    values
      (v_family_id, 'main', 100, 50, 20, 0, -50, -100),
      (v_family_id, 'minor', 50, 25, 10, 0, -25, -50);

    insert into public.profiles (id, family_id, role, display_name)
    values (new.id, v_family_id, 'parent', v_display_name);
  else
    insert into public.profiles (id, family_id, role, display_name)
    values (new.id, null, 'child', v_display_name);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------------
-- Points-Engine: RPC-Funktionen (SECURITY DEFINER, prüfen Rolle/Familie selbst)
-- -------------------------------------------------------------------------

-- Kind löst Einladungscode ein
create or replace function public.redeem_invite_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invite_codes;
begin
  if public.current_role() <> 'child' then
    raise exception 'Nur Kinderkonten können einen Code einlösen';
  end if;

  select * into v_invite from public.invite_codes
    where code = p_code and status = 'pending' and expires_at > now()
    for update;

  if not found then
    raise exception 'Ungültiger oder abgelaufener Code';
  end if;

  update public.profiles set family_id = v_invite.family_id where id = auth.uid();
  update public.invite_codes set status = 'used', used_by = auth.uid() where id = v_invite.id;
end;
$$;

-- Eltern erzeugen einen neuen Einladungscode
create or replace function public.create_invite_code(p_child_display_name text default null)
returns public.invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.invite_codes;
begin
  if public.current_role() <> 'parent' then
    raise exception 'Nur Elternkonten können Codes erzeugen';
  end if;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  insert into public.invite_codes (family_id, code, child_display_name)
  values (public.current_family_id(), v_code, p_child_display_name)
  returning * into v_row;

  return v_row;
end;
$$;

-- Kind markiert eine Aufgabe als erledigt
create or replace function public.request_task_completion(p_task_id uuid)
returns public.task_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.task_completions;
begin
  if public.current_role() <> 'child' then
    raise exception 'Nur Kinder können Aufgaben als erledigt markieren';
  end if;

  if not exists (select 1 from public.tasks where id = p_task_id and family_id = public.current_family_id() and active) then
    raise exception 'Aufgabe nicht gefunden';
  end if;

  insert into public.task_completions (task_id, child_id)
  values (p_task_id, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- Eltern bestätigen/lehnen eine Aufgaben-Erledigung ab
create or replace function public.review_task_completion(p_completion_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completion public.task_completions;
  v_task public.tasks;
begin
  if public.current_role() <> 'parent' then
    raise exception 'Nur Eltern können Aufgaben bestätigen';
  end if;

  select * into v_completion from public.task_completions where id = p_completion_id for update;
  if not found or v_completion.status <> 'pending' then
    raise exception 'Meldung nicht gefunden oder bereits bearbeitet';
  end if;

  select * into v_task from public.tasks where id = v_completion.task_id;
  if v_task.family_id <> public.current_family_id() then
    raise exception 'Kein Zugriff auf diese Familie';
  end if;

  if p_approve then
    update public.task_completions
      set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
      where id = p_completion_id;

    insert into public.point_transactions (child_id, amount, source_type, source_id, reason)
      values (v_completion.child_id, v_task.points, 'task', v_task.id, v_task.title);

    update public.profiles
      set current_point_balance = current_point_balance + v_task.points
      where id = v_completion.child_id;
  else
    update public.task_completions
      set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid()
      where id = p_completion_id;
  end if;
end;
$$;

-- Note eintragen -> Punkte automatisch nach Regel berechnen und gutschreiben
create or replace function public.submit_grade(p_child_id uuid, p_subject_id uuid, p_grade_value numeric, p_date date default current_date)
returns public.grades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject public.subjects;
  v_rule public.grade_point_rules;
  v_rounded int;
  v_points int;
  v_row public.grades;
begin
  if not (public.current_role() = 'child' and auth.uid() = p_child_id)
     and public.current_role() <> 'parent' then
    raise exception 'Keine Berechtigung';
  end if;

  select * into v_subject from public.subjects where id = p_subject_id and family_id = public.current_family_id();
  if not found then
    raise exception 'Fach nicht gefunden';
  end if;

  select * into v_rule from public.grade_point_rules
    where family_id = public.current_family_id() and subject_type = v_subject.type;

  v_rounded := least(6, greatest(1, round(p_grade_value)::int));
  v_points := case v_rounded
    when 1 then v_rule.grade_1
    when 2 then v_rule.grade_2
    when 3 then v_rule.grade_3
    when 4 then v_rule.grade_4
    when 5 then v_rule.grade_5
    else v_rule.grade_6
  end;

  insert into public.grades (child_id, subject_id, grade_value, date, points_awarded)
  values (p_child_id, p_subject_id, p_grade_value, p_date, v_points)
  returning * into v_row;

  insert into public.point_transactions (child_id, amount, source_type, source_id, reason)
  values (p_child_id, v_points, 'grade', v_row.id, 'Note ' || p_grade_value || ' in ' || v_subject.name);

  update public.profiles set current_point_balance = current_point_balance + v_points where id = p_child_id;

  return v_row;
end;
$$;

-- Kind fordert Einlösung einer Belohnung an
create or replace function public.request_redemption(p_reward_id uuid)
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward public.rewards;
  v_balance int;
  v_row public.redemptions;
begin
  if public.current_role() <> 'child' then
    raise exception 'Nur Kinder können Belohnungen einlösen';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and family_id = public.current_family_id() and active;
  if not found then
    raise exception 'Belohnung nicht gefunden';
  end if;

  select current_point_balance into v_balance from public.profiles where id = auth.uid();
  if v_balance < v_reward.point_price then
    raise exception 'Nicht genügend Punkte';
  end if;

  insert into public.redemptions (reward_id, child_id, points_spent)
  values (p_reward_id, auth.uid(), v_reward.point_price)
  returning * into v_row;

  return v_row;
end;
$$;

-- Eltern bestätigen/lehnen eine Einlösung ab
create or replace function public.review_redemption(p_redemption_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.redemptions;
  v_reward public.rewards;
  v_balance int;
begin
  if public.current_role() <> 'parent' then
    raise exception 'Nur Eltern können Einlösungen bestätigen';
  end if;

  select * into v_redemption from public.redemptions where id = p_redemption_id for update;
  if not found or v_redemption.status <> 'pending' then
    raise exception 'Anfrage nicht gefunden oder bereits bearbeitet';
  end if;

  select * into v_reward from public.rewards where id = v_redemption.reward_id;
  if v_reward.family_id <> public.current_family_id() then
    raise exception 'Kein Zugriff auf diese Familie';
  end if;

  if p_approve then
    select current_point_balance into v_balance from public.profiles where id = v_redemption.child_id;
    if v_balance < v_redemption.points_spent then
      raise exception 'Punktestand reicht nicht mehr aus';
    end if;

    update public.redemptions set status = 'approved', reviewed_at = now() where id = p_redemption_id;

    insert into public.point_transactions (child_id, amount, source_type, source_id, reason)
      values (v_redemption.child_id, -v_redemption.points_spent, 'reward', v_reward.id, v_reward.title);

    update public.profiles
      set current_point_balance = current_point_balance - v_redemption.points_spent
      where id = v_redemption.child_id;
  else
    update public.redemptions set status = 'rejected', reviewed_at = now() where id = p_redemption_id;
  end if;
end;
$$;

-- Eltern vergeben/entziehen Punkte manuell
create or replace function public.adjust_points(p_child_id uuid, p_amount int, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() <> 'parent' then
    raise exception 'Nur Eltern können Punkte manuell anpassen';
  end if;

  if not exists (select 1 from public.profiles where id = p_child_id and family_id = public.current_family_id()) then
    raise exception 'Kind gehört nicht zu deiner Familie';
  end if;

  insert into public.point_transactions (child_id, amount, source_type, reason)
  values (p_child_id, p_amount, 'manual', p_reason);

  update public.profiles set current_point_balance = current_point_balance + p_amount where id = p_child_id;
end;
$$;

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.point_settings enable row level security;
alter table public.invite_codes enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.subjects enable row level security;
alter table public.grade_point_rules enable row level security;
alter table public.grades enable row level security;
alter table public.point_transactions enable row level security;

create policy "family: select own" on public.families
  for select using (id = public.current_family_id());

create policy "profiles: select same family or self" on public.profiles
  for select using (id = auth.uid() or family_id = public.current_family_id());

create policy "profiles: update self" on public.profiles
  for update using (id = auth.uid());

create policy "point_settings: select own family" on public.point_settings
  for select using (family_id = public.current_family_id());

create policy "point_settings: parent manages" on public.point_settings
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "invite_codes: parent manages own family" on public.invite_codes
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "invite_codes: child can read to validate" on public.invite_codes
  for select using (public.current_role() = 'child');

create policy "tasks: family read" on public.tasks
  for select using (family_id = public.current_family_id());

create policy "tasks: parent write" on public.tasks
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "task_completions: family read" on public.task_completions
  for select using (
    exists (select 1 from public.tasks t where t.id = task_id and t.family_id = public.current_family_id())
  );

create policy "task_completions: child inserts own" on public.task_completions
  for insert with check (child_id = auth.uid());

create policy "rewards: family read" on public.rewards
  for select using (family_id = public.current_family_id());

create policy "rewards: parent write" on public.rewards
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "redemptions: family read" on public.redemptions
  for select using (
    exists (select 1 from public.rewards r where r.id = reward_id and r.family_id = public.current_family_id())
  );

create policy "subjects: family read" on public.subjects
  for select using (family_id = public.current_family_id());

create policy "subjects: parent write" on public.subjects
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "grade_point_rules: family read" on public.grade_point_rules
  for select using (family_id = public.current_family_id());

create policy "grade_point_rules: parent write" on public.grade_point_rules
  for all using (family_id = public.current_family_id() and public.current_role() = 'parent');

create policy "grades: family read" on public.grades
  for select using (
    exists (select 1 from public.profiles p where p.id = child_id and p.family_id = public.current_family_id())
  );

create policy "point_transactions: family read" on public.point_transactions
  for select using (
    exists (select 1 from public.profiles p where p.id = child_id and p.family_id = public.current_family_id())
  );

-- Hinweis: Alle schreibenden Operationen für task_completions/redemptions/grades/
-- point_transactions/adjust_points laufen bewusst über die obigen SECURITY DEFINER
-- Funktionen (rpc-Aufrufe), nicht über direkte INSERT/UPDATE-Policies. So bleibt
-- die komplette Punktevergabe-Logik an einer zentralen, geprüften Stelle.

-- -------------------------------------------------------------------------
-- Realtime (optional, für Live-Updates von Freigaben/Punktestand)
-- -------------------------------------------------------------------------
-- In Supabase Dashboard -> Database -> Replication kannst du zusätzlich
-- die Tabellen task_completions, redemptions, point_transactions und
-- profiles für "Realtime" aktivieren, damit UI-Updates ohne Reload kommen.
