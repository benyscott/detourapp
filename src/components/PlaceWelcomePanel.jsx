'use client';

import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useMapViewStore from '@/store/mapViewStore';
import useVisitStore from '@/store/visitStore';

/** Bottom panel on your first day somewhere new: one tap into the arrival guide (BAN-162) */
export default function PlaceWelcomePanel() {
    const place = useVisitStore((s) => s.currentPlace);
    const setPlaceGuideOpen = useMapViewStore((s) => s.setPlaceGuideOpen);

    if (!place) {
        return null;
    }

    return (
        <section className="glass-surface flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3" aria-label={`About ${place.name}`}>
            <p className="text-muted-foreground m-0 min-w-0 flex-1 text-sm">First time in {place.name}?</p>
            <Button type="button" className="shrink-0 gap-1.5 rounded-full" onClick={() => setPlaceGuideOpen(true)}>
                <BookOpen className="size-4" aria-hidden />
                Discover {place.name}
            </Button>
        </section>
    );
}
