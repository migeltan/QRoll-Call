// Single shared Supabase client for the whole app.
// Owner: Role 4 (Registration Form + App Shell).
// Role 5 imports this same client for auth, check-in and the attendee list.
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../models/database.types';

export const supabase = createClient<Database>(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
);
