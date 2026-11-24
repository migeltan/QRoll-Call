insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qr-codes', 'qr-codes', true, 1048576, array['image/png'])
on conflict (id) do nothing;

-- Public bucket: anyone with the exact URL can view an image.
-- Files are named <qr_token>.png, so names are unguessable.
-- No select policy exists, so nobody can list the bucket's contents.
-- Uploads come only from the Edge Function (service role key),
-- so no insert policy is created for anon or authenticated.