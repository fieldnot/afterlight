create table public.afterlight_account_deletion_requests (
    user_id uuid primary key references auth.users(id) on delete cascade,
    requested_at timestamptz not null default now()
);
alter table public.afterlight_account_deletion_requests enable row level security;
revoke all on public.afterlight_account_deletion_requests from public, anon, authenticated;
create function public.afterlight_request_account_deletion()
returns void language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null then
        raise exception 'Sign in to request account deletion';
    end if;
    insert into public.afterlight_account_deletion_requests (user_id)
        values (auth.uid()) on conflict (user_id) do nothing;
end;
$$;
revoke all on function public.afterlight_request_account_deletion() from public, anon;
grant execute on function public.afterlight_request_account_deletion() to authenticated;
