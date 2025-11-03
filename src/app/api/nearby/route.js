import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';
import { getCountryFromIP } from '@/lib/countryDetection';

/**
 * API route for nearby places search
 * Finds places near a location by type/category
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const type = searchParams.get('type'); // e.g., 'restaurant', 'cafe', 'bar'

    if (!lat || !lng) {
        return NextResponse.json(
            { error: 'Latitude and longitude are required' },
            { status: 400 }
        );
    }

    try {
        console.log('[API] Nearby search:', {
            location: `(${lat}, ${lng})`,
            radius: radius ? `${radius}m` : 'default',
            type: type || 'all',
        });

        // Get user's country from IP
        const userCountryCode = await getCountryFromIP();

        // Get the configured location service
        const locationService = getLocationService();

        // Search for nearby places
        const places = await locationService.searchNearby({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radius: radius ? parseInt(radius) : 5000, // Default 5km
            type,
            countryCode: userCountryCode,
        });

        console.log('[API] Found', places.length, 'nearby places');

        // Convert to JSON format
        const results = places.map(place => place.toJSON());

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[API] Error in nearby route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

