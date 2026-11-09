import { NextResponse } from 'next/server';
import { getCountryFromIP } from '@/lib/countryDetection';
import { getLocationService } from '@/services/locationServiceFactory';
import { createServiceRoleClient } from '@/utils/supabase/service-role';

const normalizeSavedPlace = (place) => ({
  id: place.id,
  name: place.name,
  place_name: place.address,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  category: place.category,
  provider: 'saved',
  source: 'saved',
  description: place.description,
  provider_ids: place.provider_ids,
});

const normalizeProviderPlace = (place) => ({
  ...place,
  address: place.place_name ?? place.address ?? null,
  source: place.provider ?? 'provider',
});

const searchSavedPlaces = async ({ query }) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('places')
    .select('id, name, category, latitude, longitude, description, address, provider_ids')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(8);

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeSavedPlace);
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [savedPlaces, countryCode] = await Promise.all([
      searchSavedPlaces({ query }),
      getCountryFromIP(),
    ]);

    const locationService = getLocationService();
    const providerPlaces = await locationService.searchPlaces(query, {
      latitude: lat ? Number.parseFloat(lat) : null,
      longitude: lng ? Number.parseFloat(lng) : null,
      radius: radius ? Number.parseInt(radius, 10) : 5000,
      countryCode,
    });

    const savedProviderIds = new Set(
      savedPlaces.flatMap((place) => [place.id, place.provider_ids?.gmaps]).filter(Boolean)
    );

    const providerResults = providerPlaces
      .map((place) => normalizeProviderPlace(place.toJSON()))
      .filter((place) => !savedProviderIds.has(place.id));

    return NextResponse.json({
      results: [...savedPlaces, ...providerResults].slice(0, 12),
    });
  } catch (error) {
    console.error('[API] Itinerary place search failed:', error);
    return NextResponse.json(
      { error: 'Failed to search places', details: error.message },
      { status: 500 }
    );
  }
}
