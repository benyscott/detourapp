'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import Compass from "@/components/Compass";
import DistanceInfo from "@/components/DistanceInfo";
import DestinationInfo from "@/components/DestinationInfo";
import PlaceSearch from "@/components/PlaceSearch";
import Recommendations from "@/components/Recommendations";
import useNavigation from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

export default function CompassPage() {
    // Automatically calculate distance and angle when location or destination changes
    useNavigation();

    return (
        <div style={{ minHeight: '100dvh', position: 'relative' }}>
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
                        <DrawerDescription>
                            Access app settings and controls.
                        </DrawerDescription>
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

            {/* Top bar */}
            <div className="top-bar">
                <DestinationInfo />
                <DistanceInfo />
            </div>

            {/* Center: Compass */}
            <Compass />

            {/* Recommendations */}
            <Recommendations />

            {/* Bottom bar: search or destination panel */}
            <PlaceSearch />
        </div>
    );
}
