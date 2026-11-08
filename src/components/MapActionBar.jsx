'use client';

import Link from 'next/link';
import { Coffee, Dices, MapPinOff, Menu, Search } from 'lucide-react';
import SettingsDrawer from '@/components/SettingsDrawer';
import { Button } from '@/components/ui/button';
import useMapViewStore from '@/store/mapViewStore';
import { cn } from '@/lib/utils';

const glassIconBtn = cn(
    'glass-icon-btn h-11 w-11 rounded-full text-slate-900',
    'hover:bg-white/35 focus-visible:ring-2 focus-visible:ring-ring/60',
    'dark:text-foreground dark:hover:bg-white/10'
);

export default function MapActionBar() {
    const isSearchOpen = useMapViewStore((s) => s.isSearchOpen);
    const isCafesOpen = useMapViewStore((s) => s.isCafesOpen);
    const isRouletteOpen = useMapViewStore((s) => s.isRouletteOpen);
    const tourOpen = useMapViewStore((s) => s.tourOpen);
    const toggleSearchOpen = useMapViewStore((s) => s.toggleSearchOpen);
    const toggleCafesOpen = useMapViewStore((s) => s.toggleCafesOpen);
    const toggleRouletteOpen = useMapViewStore((s) => s.toggleRouletteOpen);
    const setSettingsOpen = useMapViewStore((s) => s.setSettingsOpen);

    return (
        <div className="glass-surface relative flex w-full min-h-[3.25rem] items-center gap-2 rounded-2xl px-2.5 py-2 pr-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {/* The menu button is the settings: it opens the Settings drawer directly */}
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Open settings"
                    className={glassIconBtn}
                    onClick={() => setSettingsOpen(true)}
                >
                    <Menu className="size-5" />
                </Button>
                <SettingsDrawer />

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

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={isRouletteOpen ? 'Close roulette' : 'Open roulette'}
                    aria-pressed={isRouletteOpen}
                    className={cn(glassIconBtn, isRouletteOpen && 'bg-black/12 dark:bg-white/15')}
                    onClick={toggleRouletteOpen}
                >
                    <Dices className="size-5" />
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
