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
            variant="ghost"
            aria-label={isZenMode ? 'Show map' : 'Hide map'}
            aria-pressed={!isZenMode}
            className="rounded-full bg-transparent text-slate-900 hover:bg-black/5"
            onClick={toggleMode}
        >
            {isZenMode ? <Map /> : <X />}
        </Button>
    );
}
