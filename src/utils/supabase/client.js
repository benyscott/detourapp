'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublishableKey, getSupabaseUrl } from './env';

/** Supabase browser client — use from Client Components. */
export function createClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
