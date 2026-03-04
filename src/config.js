const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDev: import.meta.env.DEV,
};

const validateConfig = () => {
  const missing = [];
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const error = `❌ Missing Environment Variables: ${missing.join(', ')}. Check your .env file and restart Vite.`;
    if (config.isDev) {
      console.error(error);
    }
    return { isValid: false, error };
  }
  return { isValid: true };
};

export { config, validateConfig };
