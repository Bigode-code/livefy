create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare new_workspace_id uuid;
begin
  insert into public.profiles (id,full_name,role)
  values (new.id,coalesce(new.raw_user_meta_data->>'full_name',''),case when new.email = 'empresarialbigode530@gmail.com' then 'admin' else 'member' end);
  insert into public.workspaces (name,owner_id)
  values ('Livefy',new.id) returning id into new_workspace_id;
  insert into public.workspace_members (workspace_id,user_id,role)
  values (new_workspace_id,new.id,'owner');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  platform text not null default 'tiktok',
  mode text not null default 'shop' check (mode in ('shop','game','creative')),
  status text not null default 'draft' check (status in ('draft','live','paused','ended')),
  viewer_count integer not null default 0 check (viewer_count >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_id text,
  name text not null,
  sku text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'BRL',
  status text not null default 'available',
  rotation_seconds integer not null default 60 check (rotation_seconds >= 0),
  orders integer not null default 0 check (orders >= 0),
  gmv numeric(14,2) not null default 0 check (gmv >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,external_id)
);

create table public.events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid references public.live_sessions(id) on delete cascade,
  type text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','success','warning','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid references public.live_sessions(id) on delete cascade,
  external_id text,
  author_name text not null,
  author_handle text,
  body text not null,
  classification text,
  status text not null default 'unanswered',
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,external_id)
);

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  storage_path text not null,
  duration_seconds integer not null default 0,
  status text not null default 'ready',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  trigger jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_components (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status text not null default 'unknown',
  detail text,
  checked_at timestamptz,
  unique (workspace_id,name)
);

create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index events_workspace_created_idx on public.events(workspace_id,created_at desc);
create index comments_workspace_created_idx on public.comments(workspace_id,created_at desc);
create index products_workspace_idx on public.products(workspace_id);
create index sessions_workspace_created_idx on public.live_sessions(workspace_id,created_at desc);

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','workspaces','live_sessions','products','comments','media_items','automation_rules','workflows','workspace_settings'] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',table_name,table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.live_sessions enable row level security;
alter table public.products enable row level security;
alter table public.events enable row level security;
alter table public.comments enable row level security;
alter table public.media_items enable row level security;
alter table public.automation_rules enable row level security;
alter table public.workflows enable row level security;
alter table public.system_components enable row level security;
alter table public.workspace_settings enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "members read workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "members read memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));

do $$ declare table_name text; begin
  foreach table_name in array array['live_sessions','products','events','comments','media_items','automation_rules','workflows','system_components','workspace_settings'] loop
    execute format('create policy "members read %1$s" on public.%1$I for select using (public.is_workspace_member(workspace_id))',table_name);
    execute format('create policy "members insert %1$s" on public.%1$I for insert with check (public.is_workspace_member(workspace_id))',table_name);
    execute format('create policy "members update %1$s" on public.%1$I for update using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))',table_name);
    execute format('create policy "members delete %1$s" on public.%1$I for delete using (public.is_workspace_member(workspace_id))',table_name);
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;

insert into storage.buckets (id,name,public) values ('media','media',false)
on conflict (id) do nothing;

create policy "members read media" on storage.objects for select to authenticated
using (bucket_id = 'media' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "members upload media" on storage.objects for insert to authenticated
with check (bucket_id = 'media' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "members update media" on storage.objects for update to authenticated
using (bucket_id = 'media' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "members delete media" on storage.objects for delete to authenticated
using (bucket_id = 'media' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
