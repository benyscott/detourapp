import { NextResponse } from 'next/server';
import { getLocationService } from '@/services/locationServiceFactory';

/**
 * API route for getting detailed place information
 * Returns extended information about a specific place
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const sessionToken = searchParams.get('sessionToken');

    if (!placeId) {
        return NextResponse.json(
            { error: 'placeId parameter is required' },
            { status: 400 }
        );
    }

    try {
        console.log('[API] Place details request:', placeId);

        // Get the configured location service
        const locationService = getLocationService();

        // Get place details
        const placeDetails = await locationService.getPlaceDetails(placeId, {
            sessionToken,
        });

        console.log('[API] Retrieved details for:', placeDetails.name);

        // Convert to JSON format
        const result = placeDetails.toJSON();

        return NextResponse.json({ result });
    } catch (error) {
        console.error('[API] Error in place-details route:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

