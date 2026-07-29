import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(env.supabaseUrl || "https://missing-config.supabase.co", env.supabaseAnonKey || "missing-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
