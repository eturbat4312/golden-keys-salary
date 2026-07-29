export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  bossWhatsappNumber: import.meta.env.VITE_BOSS_WHATSAPP_NUMBER as string | undefined
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
