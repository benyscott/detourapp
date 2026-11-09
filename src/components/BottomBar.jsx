'use client';

import DestinationBottomPanel from '@/components/DestinationBottomPanel';
import MapActionBar from '@/components/MapActionBar';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel';
import PermissionAlerts from '@/components/PermissionAlerts';
import PlaceSearch from '@/components/PlaceSearch';
import RoulettePanel from '@/components/RoulettePanel';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';
import { cn } from '@/lib/utils';

export default function BottomBar() {
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const nearbyCategory = useMapViewStore((s) => s.nearbyCategory);
    const isRouletteOpen = useMapViewStore((s) => s.isRouletteOpen);
    const destination = usePlaceStore((s) => s.destination);

    const activePanel = isSearchOpen
        ? <PlaceSearch />
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
                bottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
            }}
        >
            <PermissionAlerts />
            {activePanel ? (
                <div
                    className={cn(
                        'w-full',
                        isSearchOpen ? 'max-h-none overflow-visible' : 'max-h-[66vh] overflow-y-auto'
                    )}
                >
                    {activePanel}
                </div>
            ) : null}
            <MapActionBar />
        </div>
    );
}
