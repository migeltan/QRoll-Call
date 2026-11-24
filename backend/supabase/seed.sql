insert into public.attendees (full_name, email, organization, contact_number, qr_token)
values
  ('Test Attendee One',   'test1@example.com', 'PUP CCIS', '09171234567', '00000000-0000-0000-0000-00000000000a'),
  ('Test Attendee Two',   'test2@example.com', 'PUP CCIS', '09181234567', '00000000-0000-0000-0000-00000000000b'),
  ('Test Attendee Three', 'test3@example.com', 'PUP CCIS', '09191234567', '00000000-0000-0000-0000-00000000000c')
on conflict do nothing;