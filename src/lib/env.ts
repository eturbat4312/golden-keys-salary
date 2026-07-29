export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  bossWhatsappNumber: import.meta.env.VITE_BOSS_WHATSAPP_NUMBER as string | undefined,
  bossReportToken: import.meta.env.VITE_BOSS_REPORT_TOKEN as string | undefined,
  bossUsername: (import.meta.env.VITE_BOSS_USERNAME as string | undefined) || "boss",
  bossPassword: (import.meta.env.VITE_BOSS_PASSWORD as string | undefined) || "123"
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
