import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function isPlaceholder(value) {
  return !value || value.includes("your_supabase");
}

export const isSupabaseConfigured =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

export const getSupabaseEnvError = () =>
  "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in frontend/.env.";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function assertSupabaseConfigured() {
  if (!supabase) {
    throw new Error(getSupabaseEnvError());
  }

  return supabase;
}
