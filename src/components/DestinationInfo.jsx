'use client';

import usePlaceStore from '@/store/placeStore';

export default function DestinationInfo() {
    const { destination } = usePlaceStore();

    if (!destination) {
        return null;
    }

    return (
        <h2 className="m-0 block max-w-full truncate text-center text-2xl font-semibold text-foreground transition-opacity duration-1000 ease-in-out">
            {destination.name}
        </h2>
    );
}
