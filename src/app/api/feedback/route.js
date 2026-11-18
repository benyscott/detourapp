import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

const KINDS = new Set(['bug', 'idea', 'love', 'other']);
const MIN_MESSAGE = 3;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;
// Generous: helping a friend can mean 10+ messages an hour. Only machine-like bursts are blocked.
const LIMITS = [
  { windowMs: 60 * 1000, max: 20 },
  { windowMs: 60 * 60 * 1000, max: 120 },
];

const clean = (value, max) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

/** Only the fields we asked for, short strings or small numbers. */
const cleanContext = (context) => {
  const c = context && typeof context === 'object' ? context : {};
  const size = (n) => (Number.isFinite(n) ? Math.round(Math.min(Math.max(n, 0), 10000)) : null);
  return {
    town: clean(c.town, 200),
    destination: clean(c.destination, 200),
    path: clean(c.path, 200),
    screen: { width: size(c.screen?.width), height: size(c.screen?.height) },
  };
};

const clientKeyFor = (request) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const userAgent = request.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex').slice(0, 32);
};

const isRateLimited = async (supabase, clientKey) => {
  for (const { windowMs, max } of LIMITS) {
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count, error } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('client_key', clientKey)
      .gte('created_at', since);
    if (error) throw error;
    if (count >= max) return true;
  }
  return false;
};

/** Store one piece of in-app feedback (BAN-165). */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    // Honeypot: a field people never see. Bots fill it; pretend all went well.
    if (clean(body?.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const kind = KINDS.has(body?.kind) ? body.kind : 'other';
    const message = clean(body?.message, MAX_MESSAGE);
    if (!message || message.length < MIN_MESSAGE) {
      return NextResponse.json({ error: 'message is too short' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const clientKey = clientKeyFor(request);
    if (await isRateLimited(supabase, clientKey)) {
      return NextResponse.json({ error: 'Slow down a little' }, { status: 429 });
    }

    const context = cleanContext(body?.context);
    const { error } = await supabase.from('feedback').insert({
      kind,
      message,
      contact: clean(body?.contact, MAX_CONTACT),
      town: context.town,
      context,
      client_key: clientKey,
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
