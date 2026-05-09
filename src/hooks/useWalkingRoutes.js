import { useEffect, useRef, useState } from 'react';
import usePlaceStore from '@/store/placeStore';
import { fetchWalkingRoutes } from '@/lib/mapboxDirections';
import { calculateDistance } from '@/lib/geoUtils';

const ROUTE_REQUEST_DEBOUNCE_MS = 250;
const MIN_REFETCH_M = 25;

export default function useWalkingRoutes() {
    const [routes, setRoutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const lastFetchOriginRef = useRef(null);
    const lastDestinationRef = useRef(null);
    const inflightControllerRef = useRef(null);
    const inflightTimeoutRef = useRef(null);
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const destination = usePlaceStore((state) => state.destination);
    const hasRouteInputs = Boolean(currentLocation && destination);

    const cancelInflightWork = () => {
        if (inflightTimeoutRef.current !== null) {
            window.clearTimeout(inflightTimeoutRef.current);
            inflightTimeoutRef.current = null;
        }
        if (inflightControllerRef.current) {
            inflightControllerRef.current.abort();
            inflightControllerRef.current = null;
        }
    };

    useEffect(() => {
        if (!hasRouteInputs) {
            cancelInflightWork();
            lastFetchOriginRef.current = null;
            lastDestinationRef.current = null;
            setRoutes([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        const lastDestination = lastDestinationRef.current;
        const destinationChanged =
            !lastDestination ||
            lastDestination.id !== destination.id ||
            lastDestination.latitude !== destination.latitude ||
            lastDestination.longitude !== destination.longitude;
        const lastOrigin = lastFetchOriginRef.current;
        const movedDistance = lastOrigin
            ? calculateDistance(
                lastOrigin.latitude,
                lastOrigin.longitude,
                currentLocation.latitude,
                currentLocation.longitude
            )
            : Infinity;
        const shouldFetch = destinationChanged || !lastOrigin || movedDistance >= MIN_REFETCH_M;

        if (!shouldFetch) {
            return;
        }

        cancelInflightWork();
        const abortController = new AbortController();
        inflightControllerRef.current = abortController;

        inflightTimeoutRef.current = window.setTimeout(async () => {
            inflightTimeoutRef.current = null;
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
                lastFetchOriginRef.current = currentLocation;
                lastDestinationRef.current = destination;
            } catch (routeError) {
                if (routeError?.name === 'AbortError') {
                    return;
                }
                setRoutes([]);
                setError(routeError);
            } finally {
                setIsLoading(false);
                if (inflightControllerRef.current === abortController) {
                    inflightControllerRef.current = null;
                }
            }
        }, ROUTE_REQUEST_DEBOUNCE_MS);
    }, [currentLocation, destination, hasRouteInputs]);

    useEffect(() => {
        return () => {
            cancelInflightWork();
        };
    }, []);

    if (!hasRouteInputs) {
        return { routes: [], isLoading: false, error: null };
    }

    return { routes, isLoading, error };
}

