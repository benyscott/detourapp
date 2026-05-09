'use client';

import DestinationBottomPanel from '@/components/DestinationBottomPanel';
import MapActionBar from '@/components/MapActionBar';
import NearbyCafesPanel from '@/components/NearbyCafesPanel';
import PermissionAlerts from '@/components/PermissionAlerts';
import PlaceSearch from '@/components/PlaceSearch';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';

export default function BottomBar() {
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const isCafesOpen = useMapViewStore((s) => s.isCafesOpen);
    const destination = usePlaceStore((s) => s.destination);
    const showPill = !isSearchOpen && !isCafesOpen;

    const activePanel = isSearchOpen
        ? <PlaceSearch />
        : isCafesOpen
          ? <NearbyCafesPanel />
          : destination
            ? <DestinationBottomPanel />
            : null;

    return (
        <div
            className="fixed inset-x-0 z-[1100] flex flex-col items-stretch gap-2 px-4"
            style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
            <PermissionAlerts />
            {activePanel ? <div className="w-full max-h-[66vh] overflow-y-auto">{activePanel}</div> : null}
            {showPill ? (
                <div className="flex w-full justify-center">
                    <MapActionBar />
                </div>
            ) : null}
        </div>
    );
}
