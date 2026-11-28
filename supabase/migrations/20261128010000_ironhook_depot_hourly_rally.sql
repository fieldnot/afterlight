create table public.afterlight_depot_entries (
 round_at timestamptz not null,
 base_id uuid not null references public.afterlight_bases(id) on delete cascade,
 alliance_id uuid not null references public.afterlight_alliances(id) on delete cascade,
 points integer not null check(points between 1 and 100),
 joined_at timestamptz not null default now(),
 paid boolean not null default false,
 primary key(round_at,base_id)
);
alter table public.afterlight_depot_entries enable row level security;
revoke all on public.afterlight_depot_entries from public,anon,authenticated;
create function public.afterlight_depot_round(command text default 'status') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 r timestamptz:=date_trunc('hour',now(),'UTC'); prev timestamptz:=r-interval '1 hour';
 b uuid; ally uuid; strength integer; winner uuid; leaders jsonb; payout boolean; paid_now integer:=0;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select base.id,m.alliance_id,army.troops into b,ally,strength from public.afterlight_bases base left join public.afterlight_memberships m on m.base_id=base.id left join public.afterlight_armies army on army.base_id=base.id where base.owner_id=auth.uid() and base.world_id=1;
 select alliance_id into winner from public.afterlight_depot_entries where round_at=prev group by alliance_id order by sum(points) desc,max(joined_at),alliance_id limit 1;
 if command='join' then
  if ally is null or coalesce(strength,0)<1 then raise exception 'Join an alliance and train troops first'; end if;
  insert into public.afterlight_depot_entries(round_at,base_id,alliance_id,points) values(r,b,ally,least(strength,100)) on conflict(round_at,base_id) do nothing;
 elsif command='claim' then
  update public.afterlight_depot_entries set paid=true where round_at=prev and base_id=b and alliance_id=winner and not paid;
  if found then
   update public.afterlight_armies set supplies=supplies+75 where base_id=b;
   if not found then raise exception 'Army required'; end if;
   paid_now:=75;
  end if;
 elsif command<>'status' or command is null then raise exception 'Unknown depot operation'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.score desc,q.last_join,q.tag),'[]') into leaders from (select a.tag,sum(e.points) score,max(e.joined_at) last_join from public.afterlight_depot_entries e join public.afterlight_alliances a on a.id=e.alliance_id where e.round_at=r group by a.id,a.tag order by score desc,last_join,a.id limit 5) q;
 select exists(select 1 from public.afterlight_depot_entries where round_at=prev and base_id=b and alliance_id=winner and not paid) into payout;
 return jsonb_build_object('owner',(select tag from public.afterlight_alliances where id=winner),'closes',r+interval '1 hour','leaders',leaders,'joined',exists(select 1 from public.afterlight_depot_entries where round_at=r and base_id=b),'can_join',ally is not null and coalesce(strength,0)>0,'can_claim',payout,'paid',paid_now);
end $$;
revoke all on function public.afterlight_depot_round(text) from public,anon;
grant execute on function public.afterlight_depot_round(text) to authenticated;