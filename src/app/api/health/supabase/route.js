import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('places').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
