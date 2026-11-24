alter table public.attendees enable row level security;

-- Start from zero access, then grant only what is needed.
revoke all on public.attendees from anon, authenticated;
grant select on public.attendees to authenticated;

-- Only staff can read the list.
create policy "staff can read attendees"
  on public.attendees
  for select
  to authenticated
  using (public.is_staff());

-- No insert/update/delete policies on purpose:
-- the public registers through register_attendee(),
-- staff check in through check_in(),
-- and the Edge Function writes with the service role key (bypasses RLS).