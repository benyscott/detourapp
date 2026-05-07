import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('place_lists')
      .select('id, user_id, name, slug, is_default_favourites, description, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ lists: data ?? [] });
  } catch (error) {
    console.error('[API] List fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, slug = null, description = null } = body ?? {};

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('place_lists')
      .insert({
        user_id: null,
        name: name.trim(),
        slug: slug ? slug.trim() : null,
        description: description ? description.trim() : null,
        is_default_favourites: false,
      })
      .select('id, user_id, name, slug, is_default_favourites, description, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ list: data }, { status: 201 });
  } catch (error) {
    console.error('[API] List creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create list', details: error.message },
      { status: 500 }
    );
  }
}
