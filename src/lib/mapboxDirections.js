const DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

/**
 * Fetch up to three walking routes between origin and destination.
 */
export const fetchWalkingRoutes = async ({ origin, destination, accessToken, signal }) => {
    if (!origin || !destination) {
        return { routes: [] };
    }

    if (!accessToken) {
        throw new Error('Mapbox access token is required for directions');
    }

    const originCoord = `${origin.longitude},${origin.latitude}`;
    const destinationCoord = `${destination.longitude},${destination.latitude}`;

    const params = new URLSearchParams({
        alternatives: 'true',
        geometries: 'geojson',
        overview: 'full',
        access_token: accessToken,
    });

    const requestUrl = `${DIRECTIONS_BASE_URL}/${originCoord};${destinationCoord}?${params.toString()}`;
    const response = await fetch(requestUrl, { signal });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mapbox directions request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const routes = Array.isArray(payload.routes)
        ? payload.routes.slice(0, 3).map((route, index) => ({
            id: `route-${index}`,
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration,
        }))
        : [];

    return { routes };
};

