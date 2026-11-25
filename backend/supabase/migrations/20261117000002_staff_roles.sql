-- Owner: Role 5 (Staff Auth + Check-in Scanner) - the ONLY backend file Role 5 edits.
-- Defines who counts as "staff". Role 2's policies and check_in() call public.is_staff(),
-- so keep that function name and signature exactly.

create table public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    text not null default 'staff' check (role in ('staff', 'organizer'))
);

alter table public.staff_profiles enable row level security;

-- A signed-in user can read only their own row (the app uses is_staff(), not this, for checks).
create policy "users can read own staff profile"
  on public.staff_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create function public.is_staff() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.staff_profiles where user_id = auth.uid()) $$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to anon, authenticated;