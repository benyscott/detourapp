'use client';

import { Map, X } from 'lucide-react';
import useMapViewStore from '@/store/mapViewStore';
import { Button } from '@/components/ui/button';

export default function MapToggleButton() {
    const mode = useMapViewStore((state) => state.mode);
    const toggleMode = useMapViewStore((state) => state.toggleMode);
    const isZenMode = mode === 'zen';

    return (
        <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isZenMode ? 'Show map' : 'Hide map'}
            className="fixed left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-[1000] rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            onClick={toggleMode}
        >
            {isZenMode ? <Map /> : <X />}
        </Button>
    );
}

