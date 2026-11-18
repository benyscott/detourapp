import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

const KINDS = new Set(['bug', 'idea', 'love', 'other']);
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;

const clean = (value, max) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

/** Store one piece of in-app feedback (BAN-165). */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const kind = KINDS.has(body?.kind) ? body.kind : 'other';
    const message = clean(body?.message, MAX_MESSAGE);

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('feedback').insert({
      kind,
      message,
      contact: clean(body?.contact, MAX_CONTACT),
      town: clean(body?.town, 200),
      app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      user_agent: clean(request.headers.get('user-agent'), 500),
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Save feedback failed:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
