'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import DestinationInfo from '@/components/DestinationInfo';
import DestinationSummaryMeta from '@/components/DestinationSummaryMeta';
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
            <DestinationSummaryMeta />
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
                    <DestinationSummaryMeta />
                    <DistanceInfo />
                </NavigationBar>
            }
        >
            <MapHomeInner />
        </Suspense>
    );
}
