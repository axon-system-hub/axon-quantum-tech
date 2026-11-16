-- ============================================================================
-- AXON Quantum — Supabase Postgres Schema & RLS Setup
-- Supabase Dashboard > SQL Editor 에 그대로 붙여넣어 실행하세요.
-- ============================================================================

-- 1. 개발 워크플로우 체크리스트 상태 테이블
create table if not exists public.axon_workflow_tasks (
  id text primary key,
  checked boolean not null default false,
  note text default '',
  updated_at timestamptz not null default now(),
  updated_by text default 'local-admin'
);

-- 2. R&D 실험·계측·벤더 견적 로그 테이블
create table if not exists public.axon_experiment_logs (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  title text not null,
  evidence_tier text not null default '[TARGET]',
  notes text default '',
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

-- 3. updated_at 자동 갱신 트리거
create or replace function public.set_axon_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_axon_workflow_tasks_updated on public.axon_workflow_tasks;
create trigger trg_axon_workflow_tasks_updated
before update on public.axon_workflow_tasks
for each row execute function public.set_axon_updated_at();

-- 4. Row Level Security (RLS) 활성화
alter table public.axon_workflow_tasks enable row level security;
alter table public.axon_experiment_logs enable row level security;

-- [모드 A: 개인/소규모 연구실 빠른 시작용 — Anon 키로 읽기/쓰기 허용]
-- 주의: 공개 사이트에서 타인이 체크를 바꾸지 못하게 하려면 아래 [모드 B]로 전환하세요.
drop policy if exists "axon_tasks_public_read" on public.axon_workflow_tasks;
create policy "axon_tasks_public_read"
  on public.axon_workflow_tasks for select
  using (true);

drop policy if exists "axon_tasks_public_write" on public.axon_workflow_tasks;
create policy "axon_tasks_public_write"
  on public.axon_workflow_tasks for all
  using (true)
  with check (true);

drop policy if exists "axon_logs_public_read" on public.axon_experiment_logs;
create policy "axon_logs_public_read"
  on public.axon_experiment_logs for select
  using (true);

drop policy if exists "axon_logs_public_write" on public.axon_experiment_logs;
create policy "axon_logs_public_write"
  on public.axon_experiment_logs for all
  using (true)
  with check (true);

-- [모드 B: 공개 열람 + 로그인 관리자만 수정 (운영 전환 시 위 write 정책 삭제 후 사용)]
-- drop policy if exists "axon_tasks_public_write" on public.axon_workflow_tasks;
-- create policy "axon_tasks_auth_write"
--   on public.axon_workflow_tasks for all
--   to authenticated
--   using (true)
--   with check (true);
--
-- drop policy if exists "axon_logs_public_write" on public.axon_experiment_logs;
-- create policy "axon_logs_auth_write"
--   on public.axon_experiment_logs for all
--   to authenticated
--   using (true)
--   with check (true);
