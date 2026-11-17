// DEVELOPMENT environment (used by `ng serve`, points at LOCAL Supabase).
// Owner: Role 1 (Lead / DevOps).
//
// Get the values by running, from backend/:   npm run db:status
// (copy "API URL" and the anon / publishable key).
export const environment = {
  production: false,
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'PASTE_LOCAL_ANON_KEY_HERE',
};
