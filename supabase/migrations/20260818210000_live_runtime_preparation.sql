alter table public.live_sessions
  add column if not exists runtime_state text not null default 'idle',
  add column if not exists runtime_error text,
  add column if not exists runtime_updated_at timestamptz;

alter table public.live_sessions drop constraint if exists live_sessions_runtime_state_check;
alter table public.live_sessions add constraint live_sessions_runtime_state_check
  check (runtime_state in ('idle','checking_agent','checking_camera','preparing_media','downloading','loading','ready','error'));

comment on column public.live_sessions.runtime_state is 'Local Livefy runtime preparation state; independent from whether a public LIVE has started.';
