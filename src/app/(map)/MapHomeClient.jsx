'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import DestinationInfo from '@/components/DestinationInfo';
import DistanceInfo from '@/components/DistanceInfo';
import TourQueryRunner from '@/components/itineraries/TourQueryRunner';

function MapHomeInner() {
    const searchParams = useSearchParams();
    const tourId = searchParams.get('tour');

    if (tourId) {
        return <TourQueryRunner tourId={tourId} />;
    }

    return (
        <NavigationBar>
            <DestinationInfo />
            <DistanceInfo />
        </NavigationBar>
    );
}

export default function MapHomeClient() {
    return (
        <Suspense
            fallback={
                <NavigationBar>
                    <DestinationInfo />
                    <DistanceInfo />
                </NavigationBar>
            }
        >
            <MapHomeInner />
        </Suspense>
    );
}
