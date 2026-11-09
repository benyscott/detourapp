import { useEffect, useRef, useState } from 'react';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';
import { fetchWalkingRoutes } from '@/lib/mapboxDirections';

/** How far from every suggested route you can drift before we re-route from where you are */
const OFF_ROUTE_M = 30;
/** Never re-route more often than this, so GPS jitter can't spam the Directions API */
const MIN_REROUTE_INTERVAL_MS = 8000;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Distance in metres from a point to a LineString (local flat projection; fine at street scale). */
function distanceToLine(point, coordinates) {
    if (!coordinates?.length) return Infinity;
    const cosLat = Math.cos(toRad(point.latitude));
    const R = 6371e3;
    const project = ([lng, lat]) => ({
        x: toRad(lng - point.longitude) * cosLat * R,
        y: toRad(lat - point.latitude) * R,
    });

    let best = Infinity;
    let prev = project(coordinates[0]);
    best = Math.hypot(prev.x, prev.y);
    for (let i = 1; i < coordinates.length; i += 1) {
        const next = project(coordinates[i]);
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const lengthSq = dx * dx + dy * dy;
        const t = lengthSq > 0 ? Math.max(0, Math.min(1, -(prev.x * dx + prev.y * dy) / lengthSq)) : 0;
        best = Math.min(best, Math.hypot(prev.x + t * dx, prev.y + t * dy));
        prev = next;
    }
    return best;
}

const isOffAllRoutes = (location, routes) =>
    routes.length > 0 &&
    routes.every((route) => distanceToLine(location, route.geometry?.coordinates) > OFF_ROUTE_M);

export default function useWalkingRoutes() {
    // Routes are tagged with the destination they belong to, so a new destination never
    // shows the previous route while its own is loading
    const [routeState, setRouteState] = useState({ key: null, routes: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const routesRef = useRef([]);
    const lastDestinationRef = useRef(null);
    const lastFetchAtRef = useRef(0);
    const inflightRef = useRef(null); // { controller, destinationKey }
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const destination = usePlaceStore((state) => state.destination);
    // Routes only show on the peek map, so only ask Mapbox while you're peeking
    const isPeeking = useMapViewStore((state) => state.isPeeking);
    const hasRouteInputs = Boolean(currentLocation && destination);
    const currentKey = destination ? `${destination.id}|${destination.latitude}|${destination.longitude}` : null;

    useEffect(() => {
        if (!hasRouteInputs) {
            inflightRef.current?.controller.abort();
            inflightRef.current = null;
            lastDestinationRef.current = null;
            routesRef.current = [];
            return;
        }

        const destinationKey = currentKey;
        const destinationChanged = lastDestinationRef.current !== destinationKey;

        if (destinationChanged) {
            // A new destination always wins: drop any request and route for the old one
            inflightRef.current?.controller.abort();
            inflightRef.current = null;
            routesRef.current = [];
            lastDestinationRef.current = destinationKey;
            lastFetchAtRef.current = 0;
        }

        // Fetch only while peeking, and only when there's no route yet or you've left every
        // suggested route. Never cancel a request already on its way (GPS updates ~1/s would starve it).
        if (!isPeeking || inflightRef.current) return;
        if (routesRef.current.length > 0 && !isOffAllRoutes(currentLocation, routesRef.current)) return;
        if (lastFetchAtRef.current && Date.now() - lastFetchAtRef.current < MIN_REROUTE_INTERVAL_MS) return;

        const controller = new AbortController();
        inflightRef.current = { controller, destinationKey };
        lastFetchAtRef.current = Date.now();

        (async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await fetchWalkingRoutes({
                    origin: currentLocation,
                    destination,
                    accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
                    signal: controller.signal,
                });
                routesRef.current = result.routes || [];
                setRouteState({ key: destinationKey, routes: routesRef.current });
            } catch (routeError) {
                if (routeError?.name === 'AbortError') return;
                setError(routeError);
            } finally {
                if (inflightRef.current?.controller === controller) {
                    inflightRef.current = null;
                    setIsLoading(false);
                }
            }
        })();
    }, [currentLocation, destination, hasRouteInputs, currentKey, isPeeking]);

    useEffect(() => () => inflightRef.current?.controller.abort(), []);

    if (!hasRouteInputs) {
        return { routes: [], isLoading: false, error: null };
    }

    return { routes: routeState.key === currentKey ? routeState.routes : [], isLoading, error };
}
