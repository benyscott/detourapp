import { useEffect } from 'react';
import usePlaceStore from '@/store/placeStore';
import { calculateDistance, formatDistance, calculateAngle } from '@/lib/geoUtils';

/**
 * Hook to automatically calculate distance and angle when location or destination changes
 */
export default function useNavigation() {
    const { currentLocation, destination, setDistance, setAngle } = usePlaceStore();

    useEffect(() => {
        if (currentLocation && destination) {
            const distanceInMeters = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                destination.latitude,
                destination.longitude
            );

            const formattedDistance = formatDistance(distanceInMeters);
            setDistance(formattedDistance);

            const bearingAngle = calculateAngle(
                currentLocation.latitude,
                currentLocation.longitude,
                destination.latitude,
                destination.longitude
            );
            setAngle(bearingAngle);
        } else {
            setDistance(null);
            setAngle(null);
        }
    }, [currentLocation, destination, setDistance, setAngle]);
}

