'use client';

import { Map, X } from 'lucide-react';
import useMapViewStore from '@/store/mapViewStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MapToggleButton() {
    const mode = useMapViewStore((state) => state.mode);
    const toggleMode = useMapViewStore((state) => state.toggleMode);
    const isZenMode = mode === 'zen';

    const handleClick = () => {
        toggleMode();
    };

    return (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isZenMode ? 'Show map' : 'Hide map'}
            aria-pressed={!isZenMode}
            className={cn(
                'glass-icon-btn h-11 w-11 touch-manipulation select-none rounded-full text-slate-900 shadow-none',
                'hover:bg-white/35 focus-visible:ring-2 focus-visible:ring-ring/60',
                'dark:text-foreground dark:hover:bg-white/10'
            )}
            onClick={handleClick}
        >
            {isZenMode ? <Map /> : <X />}
        </Button>
    );
}
