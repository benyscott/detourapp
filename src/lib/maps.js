/**
 * Search places using Mapbox Geocoding API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of place results
 */
export async function searchPlaces(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error('Mapbox access token is not configured');
    }

    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${accessToken}&limit=5`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Mapbox API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform Mapbox results to our format
        return data.features.map((feature) => ({
            id: feature.id,
            name: feature.text || feature.place_name,
            place_name: feature.place_name,
            coordinates: feature.center, // [lng, lat]
            latitude: feature.center[1],
            longitude: feature.center[0],
            context: feature.context, // Additional context like city, country, etc.
        }));
    } catch (error) {
        console.error('Error searching places:', error);
        throw error;
    }
}

