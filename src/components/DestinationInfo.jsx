'use client';

import usePlaceStore from '@/store/placeStore';
import useVisitStore from '@/store/visitStore';

export default function DestinationInfo() {
    const { destination } = usePlaceStore();
    const currentPlace = useVisitStore((s) => s.currentPlace);
    const showWelcome = useVisitStore((s) => s.showWelcome);
    const welcome = showWelcome && currentPlace ? `Welcome to ${currentPlace.name}` : 'Welcome to Detour ➰';

    return (
        <h2 className="m-0 block max-w-full truncate text-center text-2xl font-semibold text-foreground transition-opacity duration-1000 ease-in-out [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]">
            {destination ? destination.name : welcome}
        </h2>
    );
}
