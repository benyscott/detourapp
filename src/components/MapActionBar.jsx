'use client';

import Link from 'next/link';
import { Coffee, Menu, Search } from 'lucide-react';
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
import useMapViewStore from '@/store/mapViewStore';
import { cn } from '@/lib/utils';

const iconBtnBase = 'h-11 w-11 rounded-full bg-transparent text-slate-900 hover:bg-black/5';

export default function MapActionBar() {
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const isCafesOpen = useMapViewStore((s) => s.isCafesOpen);
    const toggleSearchOpen = useMapViewStore((s) => s.toggleSearchOpen);
    const toggleCafesOpen = useMapViewStore((s) => s.toggleCafesOpen);

    return (
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 p-2 shadow-lg backdrop-blur-md">
            <Drawer>
                <DrawerTrigger asChild>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Open menu"
                        className={iconBtnBase}
                    >
                        <Menu className="size-5" />
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

            <MapToggleButton />

            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={isSearchOpen ? 'Close search' : 'Search places'}
                aria-pressed={isSearchOpen}
                className={cn(iconBtnBase, isSearchOpen && 'bg-black/10')}
                onClick={toggleSearchOpen}
            >
                <Search className="size-5" />
            </Button>

            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={isCafesOpen ? 'Hide nearby cafes' : 'Show nearby cafes'}
                aria-pressed={isCafesOpen}
                className={cn(iconBtnBase, isCafesOpen && 'bg-black/10')}
                onClick={toggleCafesOpen}
            >
                <Coffee className="size-5" />
            </Button>
        </div>
    );
}
