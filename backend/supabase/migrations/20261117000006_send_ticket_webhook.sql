-- Owner: Role 3 (QR Generation + Email Automation)
-- Database Webhook: when a row is inserted into public.attendees, call the
-- `send-ticket` Edge Function so a QR code is generated and emailed automatically.
--
-- LOCAL DEVELOPMENT ONLY. The URL points at the local Supabase (Docker), and the
-- secret is the local placeholder, which matches WEBHOOK_SECRET=change-me in the
-- local supabase/functions/.env. Both keys below are local-only and not private.
--
-- HOSTED PROJECT: do NOT rely on this migration. After deploying the function, run
-- the hosted SQL from the PR description in the hosted SQL editor. It uses the same
-- trigger name, so it replaces this one instead of creating a duplicate.
-- pg_net sends the webhook request. Hosted projects enable it automatically when
-- Database Webhooks are on, but a local reset needs it created explicitly.
create extension if not exists pg_net;
drop trigger if exists send_ticket_on_insert on public.attendees;

create trigger send_ticket_on_insert
  after insert on public.attendees
  for each row
  execute function supabase_functions.http_request(
    'http://host.docker.internal:54321/functions/v1/send-ticket',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0","x-webhook-secret":"change-me"}',
    '{}',
    '10000'
  );