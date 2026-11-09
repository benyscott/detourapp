import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from './env';

/**
 * Refreshes the Supabase Auth session (cookie-based). Call from `middleware.js`.
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToApply) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        if (headersToApply) {
          Object.entries(headersToApply).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  // Validates JWT and triggers refresh when needed; do not call getSession() here.
  await supabase.auth.getUser();

  return supabaseResponse;
}
