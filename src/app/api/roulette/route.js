import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';
import { clampRadius, getRouletteCategory } from '@/lib/roulette';

/**
 * Roulette pool (BAN-158): every open place of a category within the radius.
 * The client draws from this pool, so re-spins cost no extra API calls.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get('lat'));
  const lng = Number.parseFloat(searchParams.get('lng'));
  const radius = clampRadius(searchParams.get('radius'));
  const category = getRouletteCategory(searchParams.get('category'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }
  if (radius <= 0) {
    return NextResponse.json({ category: category.id, radius, results: [] });
  }

  try {
    const locationService = getLocationService();
    if (typeof locationService.searchNearbyPool !== 'function') {
      return NextResponse.json({ error: 'Roulette is not supported by this location provider' }, { status: 501 });
    }

    const places = await locationService.searchNearbyPool({
      latitude: lat,
      longitude: lng,
      radius,
      type: category.type,
      openNow: category.openNow,
    });

    return NextResponse.json({
      category: category.id,
      radius,
      results: places.map((place) => place.toJSON()),
    });
  } catch (error) {
    console.error('[API] Roulette pool failed:', error);
    return NextResponse.json({ error: 'Could not load places', details: error.message }, { status: 500 });
  }
}
