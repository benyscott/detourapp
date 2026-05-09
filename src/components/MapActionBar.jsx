'use client';

import Link from 'next/link';
import { Coffee, Compass, MapPinOff, Menu, Search } from 'lucide-react';
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

const glassIconBtn = cn(
    'glass-icon-btn h-11 w-11 rounded-full text-slate-900',
    'hover:bg-white/35 focus-visible:ring-2 focus-visible:ring-ring/60',
    'dark:text-foreground dark:hover:bg-white/10'
);

export default function MapActionBar() {
    const mode = useMapViewStore((s) => s.mode);
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const isCafesOpen = useMapViewStore((s) => s.isCafesOpen);
    const tourOpen = useMapViewStore((s) => s.tourOpen);
    const bearingFollowsHeading = useMapViewStore((s) => s.bearingFollowsHeading);
    const toggleSearchOpen = useMapViewStore((s) => s.toggleSearchOpen);
    const toggleCafesOpen = useMapViewStore((s) => s.toggleCafesOpen);

    const handleHeadingBearingToggle = () => {
        const state = useMapViewStore.getState();
        if (state.bearingFollowsHeading) {
            state.setBearingFollowsHeading(false);
            return;
        }
        state.setBearingFollowsHeading(true);
        state.pulseHeadingSnap();
    };

    return (
        <div className="glass-surface relative flex w-full min-h-[3.25rem] items-center gap-2 rounded-2xl px-2.5 py-2 pr-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Open menu"
                            className={glassIconBtn}
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

                {mode === 'reveal' ? (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={
                            bearingFollowsHeading
                                ? 'Explore map bearing (unlock rotation)'
                                : 'Snap map bearing to compass heading'
                        }
                        aria-pressed={bearingFollowsHeading}
                        className={cn(
                            glassIconBtn,
                            !bearingFollowsHeading && 'ring-2 ring-amber-400/70 dark:ring-amber-400/50'
                        )}
                        onClick={handleHeadingBearingToggle}
                    >
                        <Compass className="size-5" />
                    </Button>
                ) : null}

                {tourOpen ? (
                    <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="glass-icon-btn h-9 shrink-0 rounded-full border-0 px-3 text-xs font-semibold shadow-none"
                    >
                        <Link href="/" className="inline-flex items-center gap-1.5">
                            <MapPinOff className="size-3.5 shrink-0" aria-hidden />
                            End tour
                        </Link>
                    </Button>
                ) : null}

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={isCafesOpen ? 'Hide nearby cafes' : 'Show nearby cafes'}
                    aria-pressed={isCafesOpen}
                    className={cn(glassIconBtn, isCafesOpen && 'bg-black/12 dark:bg-white/15')}
                    onClick={toggleCafesOpen}
                >
                    <Coffee className="size-5" />
                </Button>
            </div>

            <div className="flex shrink-0 items-center pl-1">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={isSearchOpen ? 'Close search' : 'Search places'}
                    aria-pressed={isSearchOpen}
                    className={cn(
                        glassIconBtn,
                        'h-12 w-12 shadow-md',
                        isSearchOpen && 'bg-black/15 ring-2 ring-black/15 dark:bg-white/20 dark:ring-white/10'
                    )}
                    onClick={toggleSearchOpen}
                >
                    <Search className="size-5" />
                </Button>
            </div>
        </div>
    );
}
