'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import BottomBar from '@/components/BottomBar';
import Compass from '@/components/Compass';
import useGeolocation from '@/hooks/useGeolocation';
import useNavigation from '@/hooks/useNavigation';
import usePinchZoom from '@/hooks/usePinchZoom';
import useWalkingRoutes from '@/hooks/useWalkingRoutes';
import usePlaceStore from '@/store/placeStore';

const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });

export default function MapLayout({ children }) {
    useGeolocation(true);
    useNavigation();
    const mapRef = useRef(null);
    const destination = usePlaceStore((state) => state.destination);
    const recommendations = usePlaceStore((state) => state.recommendations);
    const { routes } = useWalkingRoutes();
    usePinchZoom(mapRef);

    return (
        <div style={{ minHeight: '100dvh', position: 'relative' }}>
            <MapboxMap
                ref={mapRef}
                routes={routes}
                destination={destination}
                recommendations={recommendations}
            />
            <Compass />
            {children}
            <BottomBar />
        </div>
    );
}
