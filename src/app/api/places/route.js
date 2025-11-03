import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';
import { getCountryFromIP } from '@/lib/countryDetection';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius'); // From settings store

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    console.log('[API] Places search:', query, {
      location: lat && lng ? `(${lat}, ${lng})` : 'none',
      radius: radius ? `${radius}m` : 'default',
    });

    // Get user's country from IP (free and fast)
    const userCountryCode = await getCountryFromIP();
    console.log('[API] User country:', userCountryCode);

    // Get the configured location service
    const locationService = getLocationService();

    // Search for places using the service
    const places = await locationService.searchPlaces(query, {
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
      radius: radius ? parseInt(radius) : 5000, // Default 5km
      countryCode: userCountryCode,
    });

    console.log('[API] Found', places.length, 'places');

    // Convert to JSON format
    const results = places.map(place => place.toJSON());

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Error in places route:', error);

    // Return more helpful error message
    const errorMessage = error.message || 'Internal server error';
    const isGoogleApiError = errorMessage.includes('Google Places');

    return NextResponse.json(
      {
        error: isGoogleApiError ? 'Search service error' : 'Internal server error',
        details: errorMessage,
        hint: isGoogleApiError
          ? 'Check that Google Places API is enabled and API key is valid in Google Cloud Console'
          : 'See server logs for details'
      },
      { status: 500 }
    );
  }
}

