create or replace function public.register_attendee(
  p_full_name      text,
  p_email          text,
  p_organization   text,
  p_contact_number text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.attendees (full_name, email, organization, contact_number)
  values (trim(p_full_name), trim(p_email), trim(p_organization), trim(p_contact_number))
  returning id into v_id;

  return v_id;
end;
$$;
-- A duplicate email raises Postgres error 23505 on its own (unique index),
-- exactly as CONTRACTS.md requires.

create or replace function public.check_in(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token uuid;
  v_row   public.attendees;
begin
  if not public.is_staff() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  -- A token that is not a valid uuid is simply an invalid token.
  begin
    v_token := trim(p_token)::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('status', 'invalid_token', 'attendee', null);
  end;

  -- Atomic: only flips status if it is still 'registered'.
  update public.attendees
     set status        = 'checked_in',
         checked_in_at = now(),
         checked_in_by = auth.uid()
   where qr_token = v_token
     and status = 'registered'
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'status', 'checked_in',
      'attendee', jsonb_build_object(
        'name', v_row.full_name,
        'organization', v_row.organization,
        'checked_in_at', v_row.checked_in_at
      )
    );
  end if;

  select * into v_row from public.attendees where qr_token = v_token;

  if found then
    return jsonb_build_object(
      'status', 'already_checked_in',
      'attendee', jsonb_build_object(
        'name', v_row.full_name,
        'organization', v_row.organization,
        'checked_in_at', v_row.checked_in_at
      )
    );
  end if;

  return jsonb_build_object('status', 'invalid_token', 'attendee', null);
end;
$$;

-- Lock down who may call what.
revoke all on function public.register_attendee(text, text, text, text) from public;
grant execute on function public.register_attendee(text, text, text, text) to anon, authenticated;

revoke all on function public.check_in(text) from public, anon;
grant execute on function public.check_in(text) to authenticated;