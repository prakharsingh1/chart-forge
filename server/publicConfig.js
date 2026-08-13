const DEFAULTS = {
  supabaseUrl: "https://wrlxmrzjdxkpdbcutgxv.supabase.co",
  supabaseAnonKey: "sb_publishable_TetqLJfk9KeZwolwc6J-Zw_BaSUNSRg",
};

export function publicConfig() {
  return {
    supabaseUrl:
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULTS.supabaseUrl,
    supabaseAnonKey:
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      DEFAULTS.supabaseAnonKey,
  };
}

export function configScript() {
  return `window.__CF_CONFIG__=${JSON.stringify(publicConfig())};`;
}
