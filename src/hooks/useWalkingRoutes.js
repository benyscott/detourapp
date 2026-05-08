import { useEffect, useState } from 'react';
import usePlaceStore from '@/store/placeStore';
import { fetchWalkingRoutes } from '@/lib/mapboxDirections';

const ROUTE_REQUEST_DEBOUNCE_MS = 250;

export default function useWalkingRoutes() {
    const [routes, setRoutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const destination = usePlaceStore((state) => state.destination);
    const hasRouteInputs = Boolean(currentLocation && destination);

    useEffect(() => {
        if (!hasRouteInputs) {
            return;
        }

        const abortController = new AbortController();

        const timeoutId = window.setTimeout(async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await fetchWalkingRoutes({
                    origin: currentLocation,
                    destination,
                    accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
                    signal: abortController.signal,
                });

                setRoutes(result.routes || []);
            } catch (routeError) {
                if (routeError?.name === 'AbortError') {
                    return;
                }
                setRoutes([]);
                setError(routeError);
            } finally {
                setIsLoading(false);
            }
        }, ROUTE_REQUEST_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [currentLocation, destination, hasRouteInputs]);

    if (!hasRouteInputs) {
        return { routes: [], isLoading: false, error: null };
    }

    return { routes, isLoading, error };
}

