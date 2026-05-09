'use client';

import usePlaceStore from '@/store/placeStore';
import { cn } from '@/lib/utils';

export default function DistanceInfo({ className }) {
    const { distance, destination } = usePlaceStore();

    if (!destination || !distance) {
        return null;
    }

    return (
        <p
            id="distance"
            className={cn(
                'font-sans m-0 block text-lg font-normal tracking-tight text-foreground',
                className
            )}
            style={{
                opacity: distance ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
            }}
        >
            {distance}
        </p>
    );
}
