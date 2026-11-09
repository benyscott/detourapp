import { NextResponse } from 'next/server';
import { getCountryFromIP } from '@/lib/countryDetection';
import { getLocationService } from '@/services/locationServiceFactory';

/**
 * Type-ahead place search for the main search bar.
 * Uses the provider's autocomplete when it has one (Google), otherwise falls back to text search.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const sessionToken = searchParams.get('sessionToken');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const countryCode = await getCountryFromIP();
    const locationService = getLocationService();
    const options = {
      latitude: lat ? Number.parseFloat(lat) : null,
      longitude: lng ? Number.parseFloat(lng) : null,
      radius: radius ? Number.parseInt(radius, 10) : 5000,
      countryCode,
      sessionToken,
    };

    const places = typeof locationService.autocomplete === 'function'
      ? await locationService.autocomplete(query, options)
      : await locationService.searchPlaces(query, options);

    return NextResponse.json({ results: places.map((place) => place.toJSON()) });
  } catch (error) {
    console.error('[API] Autocomplete failed:', error);
    return NextResponse.json(
      { error: 'Search service error', details: error.message },
      { status: 500 }
    );
  }
}
