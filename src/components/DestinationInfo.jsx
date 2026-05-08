'use client';

import usePlaceStore from '@/store/placeStore';

export default function DestinationInfo() {
    const { destination } = usePlaceStore();

    if (!destination) {
        return null;
    }

    return (
        <h2 className="m-0 block max-w-full rounded-full bg-white/90 px-3 py-1 text-center text-2xl font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition-opacity duration-1000 ease-in-out">
            {destination.name}
        </h2>
    );
}
