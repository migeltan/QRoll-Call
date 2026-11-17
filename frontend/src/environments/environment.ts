// PRODUCTION environment (used by `ng build`).
// Owner: Role 1 (Lead / DevOps).
//
// The anon (publishable) key is safe to commit: it is meant to be public and is
// protected by Row-Level Security. NEVER put the service_role key in this repo.
export const environment = {
  production: true,
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_HOSTED_ANON_KEY',
};
