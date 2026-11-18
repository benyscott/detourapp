import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

const KINDS = new Set(['bug', 'idea', 'love', 'other']);
const MIN_MESSAGE = 3;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;
const AUDIO_BUCKET = 'feedback-audio';
const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // matches the bucket limit, under Vercel's 4.5 MB body cap
const AUDIO_EXTENSIONS = {
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
};
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

/**
 * JSON for text only; multipart when there's a voice note (BAN-183):
 * an `audio` file plus a `payload` field holding the same JSON.
 */
const readBody = async (request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    return { body: await request.json().catch(() => null), audio: null };
  }
  const form = await request.formData();
  let body = null;
  try {
    body = JSON.parse(form.get('payload'));
  } catch {
    // leave body null
  }
  const audio = form.get('audio');
  return { body, audio: audio && typeof audio === 'object' && audio.size > 0 ? audio : null };
};

/** Store one piece of in-app feedback (BAN-165), optionally with a voice note (BAN-183). */
export async function POST(request) {
  let uploadedPath = null;
  let supabase = null;
  try {
    const { body, audio } = await readBody(request);

    // Honeypot: a field people never see. Bots fill it; pretend all went well.
    if (clean(body?.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const kind = KINDS.has(body?.kind) ? body.kind : 'other';
    const message = clean(body?.message, MAX_MESSAGE);
    if (!audio && (!message || message.length < MIN_MESSAGE)) {
      return NextResponse.json({ error: 'message is too short' }, { status: 400 });
    }

    // "audio/webm;codecs=opus" → "audio/webm"
    const audioMime = audio ? (audio.type || '').split(';')[0].trim().toLowerCase() : null;
    if (audio && (!AUDIO_EXTENSIONS[audioMime] || audio.size > MAX_AUDIO_BYTES)) {
      return NextResponse.json({ error: 'unsupported or too large audio' }, { status: 400 });
    }

    supabase = createServiceRoleClient();
    const clientKey = clientKeyFor(request);
    if (await isRateLimited(supabase, clientKey)) {
      return NextResponse.json({ error: 'Slow down a little' }, { status: 429 });
    }

    if (audio) {
      const month = new Date().toISOString().slice(0, 7);
      const path = `${month}/${randomUUID()}.${AUDIO_EXTENSIONS[audioMime]}`;
      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, audio, { contentType: audioMime });
      if (uploadError) throw uploadError;
      uploadedPath = path;
    }

    const duration = Number(body?.audioDurationS);
    const context = cleanContext(body?.context);
    const { error } = await supabase.from('feedback').insert({
      kind,
      message,
      audio_path: uploadedPath,
      audio_mime: audioMime,
      audio_duration_s: audio && Number.isFinite(duration) ? Math.round(Math.min(Math.max(duration, 0), 600)) : null,
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
    // Don't leave an orphan recording behind if the row couldn't be saved
    if (uploadedPath && supabase) {
      await supabase.storage.from(AUDIO_BUCKET).remove([uploadedPath]).catch(() => {});
    }
    console.error('[API] Save feedback failed:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
