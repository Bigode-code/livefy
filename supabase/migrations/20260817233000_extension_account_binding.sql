alter table public.extension_devices
  add column if not exists tiktok_account_key text,
  add column if not exists tiktok_username text,
  add column if not exists tiktok_logged_in boolean not null default false,
  add column if not exists shop_eligible boolean not null default false,
  add column if not exists live_eligible boolean not null default false,
  add column if not exists eligibility_status text not null default 'unknown',
  add column if not exists eligibility_checked_at timestamptz;

alter table public.extension_devices drop constraint if exists extension_devices_eligibility_status_check;
alter table public.extension_devices add constraint extension_devices_eligibility_status_check
  check (eligibility_status in ('unknown','signed_out','ineligible','eligible','account_mismatch'));

create index if not exists extension_devices_tiktok_account_idx
  on public.extension_devices(tiktok_account_key) where tiktok_account_key is not null;

create or replace function public.extension_heartbeat_v2(
  p_device_id uuid,
  p_device_secret text,
  p_page_host text default null,
  p_page_type text default null,
  p_version text default null,
  p_tiktok_logged_in boolean default false,
  p_tiktok_account_key text default null,
  p_tiktok_username text default null,
  p_shop_eligible boolean default false,
  p_live_eligible boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  device public.extension_devices%rowtype;
  normalized_account text;
  eligible boolean;
  next_status text;
begin
  select * into device from public.extension_devices
  where id = p_device_id and revoked_at is null
    and secret_hash = pg_catalog.encode(extensions.digest(pg_catalog.convert_to(coalesce(p_device_secret,''),'UTF8'),'sha256'),'hex');
  if device.id is null then raise exception 'Device authentication failed'; end if;

  normalized_account := left(nullif(trim(coalesce(p_tiktok_account_key,'')),''),160);
  eligible := coalesce(p_tiktok_logged_in,false)
    and normalized_account is not null
    and (coalesce(p_shop_eligible,false) or coalesce(p_live_eligible,false));

  if device.tiktok_account_key is not null
    and normalized_account is not null
    and device.tiktok_account_key <> normalized_account then
    update public.extension_devices set
      status='offline',tiktok_logged_in=false,shop_eligible=false,live_eligible=false,
      eligibility_status='account_mismatch',eligibility_checked_at=now(),last_seen_at=now()
    where id=device.id;
    raise exception 'This token is already bound to another TikTok account';
  end if;

  if not coalesce(p_tiktok_logged_in,false) then next_status := 'signed_out';
  elsif not eligible then next_status := 'ineligible';
  else next_status := 'eligible';
  end if;

  update public.extension_devices set
    tiktok_account_key=case when eligible then coalesce(tiktok_account_key,normalized_account) else tiktok_account_key end,
    tiktok_username=case when p_tiktok_logged_in then left(nullif(trim(coalesce(p_tiktok_username,'')),''),120) else tiktok_username end,
    tiktok_logged_in=coalesce(p_tiktok_logged_in,false),
    shop_eligible=eligible and coalesce(p_shop_eligible,false),
    live_eligible=eligible and coalesce(p_live_eligible,false),
    eligibility_status=next_status,eligibility_checked_at=now(),
    status=case when eligible then 'connected' else 'offline' end,last_seen_at=now(),
    last_page_host=left(nullif(p_page_host,''),120),last_page_type=left(nullif(p_page_type,''),40),
    extension_version=case when char_length(coalesce(p_version,'')) between 1 and 24 then p_version else extension_version end
  where id=device.id;

  insert into public.system_components(workspace_id,name,status,detail,checked_at)
  values(device.workspace_id,'Chrome Extension · '||left(device.id::text,8),case when eligible then 'healthy' else 'warning' end,
    case when eligible then 'Eligible TikTok account · @'||coalesce(nullif(p_tiktok_username,''),'unknown') else 'Controller disabled · '||next_status end,now())
  on conflict(workspace_id,name) do update set status=excluded.status,detail=excluded.detail,checked_at=excluded.checked_at;

  return jsonb_build_object('ok',true,'controller_enabled',eligible,'eligibility_status',next_status,'server_time',now());
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
  if device.eligibility_status <> 'eligible' or not device.tiktok_logged_in or not (device.shop_eligible or device.live_eligible) then
    raise exception 'An eligible TikTok Shop or LIVE account is required';
  end if;
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
      values(device.workspace_id,active_session,'extension:'||device.id||':'||event_id,left(coalesce(nullif(item->>'author',''),'TikTok viewer'),120),left(nullif(item->>'handle',''),120),left(coalesce(item->>'body',''),2000),'extension','unanswered')
      on conflict(workspace_id,external_id) do nothing;
    elsif event_type = 'product' then
      insert into public.products(workspace_id,external_id,name,price,currency,status)
      values(device.workspace_id,'extension:'||coalesce(nullif(item->>'product_id',''),event_id),left(coalesce(nullif(item->>'name',''),'TikTok product'),240),greatest(0,coalesce((nullif(item->>'price',''))::numeric,0)),left(coalesce(nullif(item->>'currency',''),'BRL'),3),'available')
      on conflict(workspace_id,external_id) do update set name=excluded.name,price=excluded.price,currency=excluded.currency,updated_at=now();
    elsif event_type = 'live_metrics' then
      update public.live_sessions set viewer_count=greatest(0,least(2147483647,coalesce((nullif(item->>'viewers',''))::integer,0))) where id=active_session;
    else
      event_message := left(coalesce(nullif(item->>'message',''),'TikTok page detected'),500);
      insert into public.events(workspace_id,session_id,type,message,severity,metadata)
      values(device.workspace_id,active_session,'extension.page_status',event_message,'info',jsonb_build_object('device_id',device.id,'page_host',left(coalesce(item->>'page_host',''),120),'page_type',left(coalesce(item->>'page_type',''),40)));
    end if;
    accepted := accepted + 1;
  end loop;
  update public.extension_devices set status='connected',last_seen_at=now() where id=device.id;
  return jsonb_build_object('accepted',accepted,'server_time',now());
end;
$$;

revoke all on function public.extension_heartbeat_v2(uuid,text,text,text,text,boolean,text,text,boolean,boolean) from public;
grant execute on function public.extension_heartbeat_v2(uuid,text,text,text,text,boolean,text,text,boolean,boolean) to anon,authenticated;

