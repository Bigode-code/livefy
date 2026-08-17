create table public.extension_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at > created_at)
);

create table public.extension_devices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  browser text not null default 'Chrome' check (char_length(browser) between 1 and 40),
  extension_version text not null default '1.0.0' check (char_length(extension_version) between 1 and 24),
  secret_hash text not null check (secret_hash ~ '^[a-f0-9]{64}$'),
  consent_version text not null default '2026-08-17',
  status text not null default 'offline' check (status in ('connected','offline','revoked')),
  last_page_host text,
  last_page_type text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.extension_event_receipts (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.extension_devices(id) on delete cascade,
  external_id text not null check (char_length(external_id) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (device_id,external_id)
);

create index extension_pairing_expiry_idx on public.extension_pairing_codes(expires_at);
create index extension_devices_workspace_idx on public.extension_devices(workspace_id,last_seen_at desc);
create index extension_receipts_created_idx on public.extension_event_receipts(created_at);

create trigger set_extension_devices_updated_at before update on public.extension_devices
for each row execute procedure public.set_updated_at();

alter table public.extension_pairing_codes enable row level security;
alter table public.extension_devices enable row level security;
alter table public.extension_event_receipts enable row level security;

create policy "members manage extension pairing codes" on public.extension_pairing_codes
for all to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "members read extension devices" on public.extension_devices
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members update extension devices" on public.extension_devices
for update to authenticated using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
create policy "members delete extension devices" on public.extension_devices
for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "members read extension receipts" on public.extension_event_receipts
for select to authenticated using (
  exists (select 1 from public.extension_devices d where d.id = device_id and public.is_workspace_member(d.workspace_id))
);

grant select,insert,delete on public.extension_pairing_codes to authenticated;
grant select,update,delete on public.extension_devices to authenticated;
grant select on public.extension_event_receipts to authenticated;
grant usage,select on sequence public.extension_event_receipts_id_seq to authenticated;

create or replace function public.claim_extension_pairing(
  p_code text,
  p_name text,
  p_version text,
  p_consent_version text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  normalized_code text;
  requested_hash text;
  pairing public.extension_pairing_codes%rowtype;
  raw_secret text;
  new_device public.extension_devices%rowtype;
begin
  normalized_code := upper(pg_catalog.regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g'));
  if normalized_code !~ '^[A-Z2-9]{16}$' then raise exception 'Invalid pairing code'; end if;
  if char_length(trim(coalesce(p_name,''))) not between 1 and 80 then raise exception 'Invalid device name'; end if;
  if char_length(coalesce(p_version,'')) not between 1 and 24 then raise exception 'Invalid extension version'; end if;
  if p_consent_version <> '2026-08-17' then raise exception 'Consent is required'; end if;

  requested_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(normalized_code,'UTF8'),'sha256'),'hex');
  select * into pairing from public.extension_pairing_codes
  where code_hash = requested_hash and expires_at > now()
  for update skip locked;
  if pairing.id is null then raise exception 'Pairing code is invalid or expired'; end if;

  raw_secret := pg_catalog.encode(extensions.gen_random_bytes(32),'hex');
  insert into public.extension_devices(workspace_id,created_by,name,browser,extension_version,secret_hash,consent_version,status,last_seen_at)
  values(pairing.workspace_id,pairing.created_by,trim(p_name),'Chrome',p_version,
    pg_catalog.encode(extensions.digest(pg_catalog.convert_to(raw_secret,'UTF8'),'sha256'),'hex'),p_consent_version,'connected',now())
  returning * into new_device;
  delete from public.extension_pairing_codes where id = pairing.id;

  return jsonb_build_object('device_id',new_device.id,'device_secret',raw_secret,'workspace_id',new_device.workspace_id);
end;
$$;

create or replace function public.extension_heartbeat(
  p_device_id uuid,
  p_device_secret text,
  p_page_host text default null,
  p_page_type text default null,
  p_version text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare device public.extension_devices%rowtype;
begin
  select * into device from public.extension_devices
  where id = p_device_id and revoked_at is null
    and secret_hash = pg_catalog.encode(extensions.digest(pg_catalog.convert_to(coalesce(p_device_secret,''),'UTF8'),'sha256'),'hex');
  if device.id is null then raise exception 'Device authentication failed'; end if;

  update public.extension_devices set
    status='connected',last_seen_at=now(),
    last_page_host=left(nullif(p_page_host,''),120),last_page_type=left(nullif(p_page_type,''),40),
    extension_version=case when char_length(coalesce(p_version,'')) between 1 and 24 then p_version else extension_version end
  where id=device.id;

  insert into public.system_components(workspace_id,name,status,detail,checked_at)
  values(device.workspace_id,'Chrome Extension · '||left(device.id::text,8),'healthy',
    'Connected as '||device.name||coalesce(' · '||nullif(p_page_type,''),''),now())
  on conflict(workspace_id,name) do update set status='healthy',detail=excluded.detail,checked_at=excluded.checked_at;
  return jsonb_build_object('ok',true,'server_time',now());
end;
$$;

create or replace function public.ingest_extension_events(
  p_device_id uuid,
  p_device_secret text,
  p_events jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  device public.extension_devices%rowtype;
  item jsonb;
  receipt_id bigint;
  accepted integer := 0;
  active_session uuid;
  event_type text;
  event_id text;
  event_message text;
begin
  select * into device from public.extension_devices
  where id = p_device_id and revoked_at is null
    and secret_hash = pg_catalog.encode(extensions.digest(pg_catalog.convert_to(coalesce(p_device_secret,''),'UTF8'),'sha256'),'hex');
  if device.id is null then raise exception 'Device authentication failed'; end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 64 then raise exception 'Invalid event batch'; end if;
  select id into active_session from public.live_sessions where workspace_id=device.workspace_id and status='live' order by started_at desc nulls last limit 1;

  for item in select value from jsonb_array_elements(p_events) loop
    event_id := left(coalesce(item->>'id',''),160);
    event_type := left(coalesce(item->>'type',''),40);
    if event_id = '' or event_type not in ('page_status','comment','product','live_metrics') then continue; end if;
    receipt_id := null;
    insert into public.extension_event_receipts(device_id,external_id) values(device.id,event_id)
    on conflict(device_id,external_id) do nothing returning id into receipt_id;
    if receipt_id is null then continue; end if;

    if event_type = 'comment' then
      insert into public.comments(workspace_id,session_id,external_id,author_name,author_handle,body,classification,status)
      values(device.workspace_id,active_session,'extension:'||device.id||':'||event_id,
        left(coalesce(nullif(item->>'author',''),'TikTok viewer'),120),left(nullif(item->>'handle',''),120),
        left(coalesce(item->>'body',''),2000),'extension','unanswered')
      on conflict(workspace_id,external_id) do nothing;
    elsif event_type = 'product' then
      insert into public.products(workspace_id,external_id,name,price,currency,status)
      values(device.workspace_id,'extension:'||coalesce(nullif(item->>'product_id',''),event_id),
        left(coalesce(nullif(item->>'name',''),'TikTok product'),240),
        greatest(0,coalesce((nullif(item->>'price',''))::numeric,0)),left(coalesce(nullif(item->>'currency',''),'BRL'),3),'available')
      on conflict(workspace_id,external_id) do update set name=excluded.name,price=excluded.price,currency=excluded.currency,updated_at=now();
    elsif event_type = 'live_metrics' then
      update public.live_sessions set viewer_count=greatest(0,least(2147483647,coalesce((nullif(item->>'viewers',''))::integer,0)))
      where id=active_session;
    else
      event_message := left(coalesce(nullif(item->>'message',''),'TikTok page detected'),500);
      insert into public.events(workspace_id,session_id,type,message,severity,metadata)
      values(device.workspace_id,active_session,'extension.page_status',event_message,'info',
        jsonb_build_object('device_id',device.id,'page_host',left(coalesce(item->>'page_host',''),120),'page_type',left(coalesce(item->>'page_type',''),40)));
    end if;
    accepted := accepted + 1;
  end loop;

  update public.extension_devices set status='connected',last_seen_at=now() where id=device.id;
  return jsonb_build_object('accepted',accepted,'server_time',now());
end;
$$;

revoke all on function public.claim_extension_pairing(text,text,text,text) from public;
revoke all on function public.extension_heartbeat(uuid,text,text,text,text) from public;
revoke all on function public.ingest_extension_events(uuid,text,jsonb) from public;
grant execute on function public.claim_extension_pairing(text,text,text,text) to anon,authenticated;
grant execute on function public.extension_heartbeat(uuid,text,text,text,text) to anon,authenticated;
grant execute on function public.ingest_extension_events(uuid,text,jsonb) to anon,authenticated;
