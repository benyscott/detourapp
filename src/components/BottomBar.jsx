'use client';

import DestinationBottomPanel from '@/components/DestinationBottomPanel';
import MapActionBar from '@/components/MapActionBar';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel';
import PermissionAlerts from '@/components/PermissionAlerts';
import RoulettePanel from '@/components/RoulettePanel';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';

export default function BottomBar() {
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const nearbyCategory = useMapViewStore((s) => s.nearbyCategory);
    const isRouletteOpen = useMapViewStore((s) => s.isRouletteOpen);
    const destination = usePlaceStore((s) => s.destination);
    const keyboardInset = useKeyboardInset();

    // Search lives inside the action bar itself (MapActionBar)
    const activePanel = isSearchOpen
        ? null
        : nearbyCategory
          ? <NearbyPlacesPanel />
          : isRouletteOpen
            ? <RoulettePanel />
            : destination
            ? <DestinationBottomPanel />
            : null;

    return (
        <div
            className="fixed inset-x-0 z-[1100] flex flex-col gap-2 px-3"
            style={{
                // Sit right on top of the keyboard when it's open
                bottom: keyboardInset > 0
                    ? `${keyboardInset + 8}px`
                    : 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
            }}
        >
            <PermissionAlerts />
            {activePanel ? (
                <div className="w-full">{activePanel}</div>
            ) : null}
            <MapActionBar />
        </div>
    );
}
