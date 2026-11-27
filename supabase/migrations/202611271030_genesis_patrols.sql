create table public.afterlight_patrol_clears (
  site_id integer primary key references public.afterlight_exploration_sites(id),
  wave bigint not null
);
alter table public.afterlight_patrol_clears enable row level security;
revoke all on public.afterlight_patrol_clears from public, anon, authenticated;

-- A shared ten-minute wave moves each patrol a few tiles around its nest.
create function public.afterlight_patrols(cx integer, cy integer, radius integer default 16)
returns table(site_id integer, wave bigint, x integer, y integer, level integer,
  elite boolean, required_troops integer, reward integer, ends_at timestamptz, cleared boolean)
language sql stable security definer set search_path = '' as $$
  with current_wave as (select floor(extract(epoch from now())/600)::bigint as n),
  patrol as (
    select s.id, w.n, greatest(0,least(2047,s.x+((s.id::bigint*7+w.n*3)%11)::int-5)) as px,
      greatest(0,least(2047,s.y+((s.id::bigint*3+w.n*7)%11)::int-5)) as py,
      greatest(1,least(10,(s.required_troops+9)/10)) as lvl, (s.id+w.n)%7=0 as special
    from public.afterlight_exploration_sites s cross join current_wave w
    where s.world_id=1 and s.kind='infected' and radius between 0 and 96
      and cx between 0 and 2047 and cy between 0 and 2047
      and s.x between cx-radius-5 and cx+radius+5 and s.y between cy-radius-5 and cy+radius+5
  )
  select p.id,p.n,p.px,p.py,p.lvl,p.special,8+p.lvl*2+case when p.special then 10 else 0 end,
    10+p.lvl*4+case when p.special then 40 else 0 end,to_timestamp((p.n+1)*600),
    coalesce(c.wave=p.n,false)
  from patrol p left join public.afterlight_patrol_clears c on c.site_id=p.id
  where abs(p.px-cx)<=radius and abs(p.py-cy)<=radius;
$$;

create function public.afterlight_hunt_patrol(target_site integer, target_wave bigint)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  home public.afterlight_bases%rowtype;
  army public.afterlight_armies%rowtype;
  target record;
  credited integer;
begin
  select * into strict home from public.afterlight_bases where owner_id=auth.uid() and world_id=1;
  select * into strict army from public.afterlight_armies where base_id=home.id for update;
  select * into target from public.afterlight_patrols(home.x,home.y,96) p
    where p.site_id=target_site and p.wave=target_wave and abs(p.x-home.x)+abs(p.y-home.y)<=96;
  if not found then raise exception 'Patrol moved or outside hunting range.'; end if;
  if army.troops<target.required_troops then raise exception 'More available troops required.'; end if;
  insert into public.afterlight_patrol_clears as c values(target_site,target_wave)
    on conflict(site_id) do update set wave=excluded.wave where c.wave<excluded.wave;
  if not found then raise exception 'Another army cleared this patrol.'; end if;
  credited:=least(1000000-army.supplies,target.reward);
  update public.afterlight_armies set supplies=supplies+credited where base_id=home.id;
  return credited;
end;
$$;
revoke all on function public.afterlight_patrols(integer,integer,integer), public.afterlight_hunt_patrol(integer,bigint) from public, anon;
grant execute on function public.afterlight_patrols(integer,integer,integer), public.afterlight_hunt_patrol(integer,bigint) to authenticated;
