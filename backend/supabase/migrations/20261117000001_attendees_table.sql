create table public.attendees (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null check (char_length(trim(full_name)) between 2 and 120),
  email          text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  organization   text not null check (char_length(trim(organization)) between 1 and 120),
  contact_number text not null check (char_length(trim(contact_number)) between 7 and 20),
  qr_token       uuid not null unique default gen_random_uuid(),
  qr_image_path  text,
  email_sent_at  timestamptz,
  status         text not null default 'registered'
                 check (status in ('registered', 'checked_in')),
  checked_in_at  timestamptz,
  checked_in_by  uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

comment on table public.attendees is 'Seminar registrants. Public can only insert via register_attendee(); staff read and check in.';

-- Unique email, case-insensitive
create unique index attendees_email_unique on public.attendees (lower(email));
create index attendees_status_idx on public.attendees (status);