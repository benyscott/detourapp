import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';

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

    const { setCurrentLocation } = usePlaceStore();

    useEffect(() => {
        if (!isTracking) {
            // Stop watching if tracking is disabled
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                setIsWatching(false);
            }
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser.');
            return;
        }

        const positionHandler = (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { latitude, longitude };

            setLocation(newLocation);
            setCurrentLocation(newLocation);
            setError(null);
        };

        const errorHandler = (err) => {
            console.error('Geolocation error:', err);
            setError('Unable to get your location. Please allow location access.');
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
        };
    }, [isTracking, setCurrentLocation]);

    return { location, error, isTracking: isWatching };
}

