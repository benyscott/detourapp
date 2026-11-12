'use client';

import { useSyncExternalStore } from 'react';
import { FIRST_OPEN_GREETING, pickGreeting } from '@/lib/greetings';
import { loadVisitHistory } from '@/lib/visitHistory';
import usePlaceStore from '@/store/placeStore';
import useVisitStore from '@/store/visitStore';

/**
 * Picked once per app open, on the phone (never on the server, where the time and the
 * random pick would differ and break hydration). "Welcome to Detour" only on the very
 * first open, when there's no visit history yet.
 */
let sessionGreeting = null;
const getGreeting = () => {
    if (sessionGreeting === null) {
        sessionGreeting =
            Object.keys(loadVisitHistory()).length === 0 ? FIRST_OPEN_GREETING : pickGreeting(new Date());
    }
    return sessionGreeting;
};
const subscribe = () => () => {};
const getServerGreeting = () => ' '; // keeps the title's height until the phone picks

export default function DestinationInfo() {
    const { destination } = usePlaceStore();
    const currentPlace = useVisitStore((s) => s.currentPlace);
    const showWelcome = useVisitStore((s) => s.showWelcome);
    const greeting = useSyncExternalStore(subscribe, getGreeting, getServerGreeting);

    // Destination > arrival welcome > greeting
    const title = destination
        ? destination.name
        : showWelcome && currentPlace
          ? `Welcome to ${currentPlace.name}`
          : greeting;

    return (
        <h2 className="m-0 block max-w-full truncate text-center text-2xl font-semibold text-foreground transition-opacity duration-1000 ease-in-out [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]">
            {title}
        </h2>
    );
}
