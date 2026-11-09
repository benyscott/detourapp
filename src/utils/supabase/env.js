/** @returns {string | undefined} */
export const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Prefer the new publishable key; falls back to the legacy anon key.
 * @returns {string | undefined}
 */
export const getSupabasePublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
