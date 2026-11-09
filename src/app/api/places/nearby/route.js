import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';

/**
 * Nearby list for the category chips: the 20 closest places of a type, with rating and
 * weekly opening hours. Filtering (open now / open at / rating) happens on the client.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get('lat'));
  const lng = Number.parseFloat(searchParams.get('lng'));
  const radius = Math.min(50000, Math.max(1, Number.parseInt(searchParams.get('radius'), 10) || 1000));
  const type = searchParams.get('type');

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) {
    return NextResponse.json({ error: 'lat, lng and type are required' }, { status: 400 });
  }

  try {
    const locationService = getLocationService();
    if (typeof locationService.searchNearbyDetailed !== 'function') {
      return NextResponse.json({ error: 'Not supported by this location provider' }, { status: 501 });
    }

    const results = await locationService.searchNearbyDetailed({ latitude: lat, longitude: lng, radius, type });
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Nearby list failed:', error);
    return NextResponse.json({ error: 'Could not load places', details: error.message }, { status: 500 });
  }
}
