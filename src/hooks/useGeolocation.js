import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';

const resolveGeolocationErrorMessage = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        const host = window.location.hostname;
        if (host !== 'localhost' && host !== '127.0.0.1') {
            return 'Location requires a secure connection (HTTPS). Open this app over HTTPS, or use localhost on your computer.';
        }
    }
    return 'Unable to get your location. Please allow location access.';
};

/**
 * Hook to track user geolocation and update store
 * @param {boolean} isTracking - Whether to start tracking location
 * @returns {object} { location: {lat, lng} | null, error: string | null, isTracking: boolean }
 */
export default function useGeolocation(isTracking = false) {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isWatching, setIsWatching] = useState(false);
    const watchIdRef = useRef(null);

    const setCurrentLocation = usePlaceStore((state) => state.setCurrentLocation);
    const setGeolocationError = usePlaceStore((state) => state.setGeolocationError);

    useEffect(() => {
        if (!isTracking) {
            // Stop watching if tracking is disabled
            if (watchIdRef.current !== null) {
                console.log('[Geolocation] Stopping location tracking');
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                setIsWatching(false);
            }
            setGeolocationError(null);
            return;
        }

        if (!navigator.geolocation) {
            const msg = 'Geolocation is not supported by this browser.';
            setError(msg);
            setGeolocationError(msg);
            return;
        }

        console.log('[Geolocation] Starting location tracking');

        const positionHandler = (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { latitude, longitude };

            console.log('[Geolocation] Location update', { latitude, longitude });
            setLocation(newLocation);
            setCurrentLocation(newLocation);
            setError(null);
            setGeolocationError(null);
        };

        const errorHandler = (err) => {
            console.error('[Geolocation] Error:', err.code, err.message);
            const msg = resolveGeolocationErrorMessage();
            setError(msg);
            setGeolocationError(msg);
            setIsWatching(false);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };

        // Start watching position
        const options = {
            enableHighAccuracy: true,
            maximumAge: 0,
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            positionHandler,
            errorHandler,
            options
        );

        setIsWatching(true);

        // Cleanup on unmount or when tracking stops
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                setIsWatching(false);
            }
            setGeolocationError(null);
        };
    }, [isTracking, setCurrentLocation, setGeolocationError]);

    return { location, error, isTracking: isWatching };
}

