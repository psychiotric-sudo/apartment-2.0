export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  version: '4.2.KRM9' // X.Y.ZZZZ
};

export const validateConfig = () => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      isValid: false,
      error: 'Missing Supabase credentials. Check your .env file.'
    };
  }
  return { isValid: true };
};
