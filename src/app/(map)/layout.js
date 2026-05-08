'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import Compass from '@/components/Compass';
import MapToggleButton from '@/components/MapToggleButton';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import useGeolocation from '@/hooks/useGeolocation';
import useNavigation from '@/hooks/useNavigation';
import usePinchZoom from '@/hooks/usePinchZoom';
import useWalkingRoutes from '@/hooks/useWalkingRoutes';
import usePlaceStore from '@/store/placeStore';

const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });

export default function MapLayout({ children }) {
    useGeolocation(true);
    useNavigation();
    const mapRef = useRef(null);
    const destination = usePlaceStore((state) => state.destination);
    const recommendations = usePlaceStore((state) => state.recommendations);
    const { routes } = useWalkingRoutes();
    usePinchZoom(mapRef);

    return (
        <div style={{ minHeight: '100dvh', position: 'relative' }}>
            <MapboxMap
                ref={mapRef}
                routes={routes}
                destination={destination}
                recommendations={recommendations}
            />
            <MapToggleButton />

            <Drawer>
                <DrawerTrigger asChild>
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        aria-label="Open menu"
                        className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-[1000] rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    >
                        <Menu />
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Menu</DrawerTitle>
                        <DrawerDescription>Access app settings and controls.</DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-3 px-4 pb-6">
                        <DrawerClose asChild>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/itineraries">Itineraries</Link>
                            </Button>
                        </DrawerClose>
                        <DrawerClose asChild>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/settings">Settings</Link>
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerContent>
            </Drawer>

            <Compass />
            {children}
        </div>
    );
}
