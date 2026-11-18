import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';

/**
 * "Search around you" results (BAN-167): up to 20 places matching a free-text query within
 * the radius, closest first, with rating and weekly opening hours. Filtering happens on the client.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const lat = Number.parseFloat(searchParams.get('lat'));
  const lng = Number.parseFloat(searchParams.get('lng'));
  const radius = Math.min(50000, Math.max(1, Number.parseInt(searchParams.get('radius'), 10) || 1000));

  if (!query || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'q, lat and lng are required' }, { status: 400 });
  }

  try {
    const locationService = getLocationService();
    if (typeof locationService.searchTextDetailed !== 'function') {
      return NextResponse.json({ error: 'Not supported by this location provider' }, { status: 501 });
    }

    const results = await locationService.searchTextDetailed({ query, latitude: lat, longitude: lng, radius });
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Text search failed:', error);
    return NextResponse.json({ error: 'Could not search', details: error.message }, { status: 500 });
  }
}
