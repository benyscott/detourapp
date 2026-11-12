'use client';

import { useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { getPlaceGuide } from '@/lib/placeGuides';
import { cn } from '@/lib/utils';
import useMapViewStore from '@/store/mapViewStore';
import useVisitStore from '@/store/visitStore';

/** Near-full-screen guide to the town you're in (BAN-162) */
export default function PlaceGuideDrawer() {
    const isOpen = useMapViewStore((s) => s.isPlaceGuideOpen);
    const setOpen = useMapViewStore((s) => s.setPlaceGuideOpen);
    const place = useVisitStore((s) => s.currentPlace);
    const guideOpened = useVisitStore((s) => s.guideOpened);

    // Opening the guide ends the welcome for this visit
    useEffect(() => {
        if (isOpen) guideOpened();
    }, [isOpen, guideOpened]);

    const guide = getPlaceGuide(place);
    if (!place || !guide) {
        return null;
    }

    const subtitle = [place.region !== place.name ? place.region : null, place.country].filter(Boolean).join(', ');

    return (
        <Drawer open={isOpen} onOpenChange={setOpen}>
            <DrawerContent className="h-[92dvh] data-[vaul-drawer-direction=bottom]:max-h-[92dvh]">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>{place.name}</DrawerTitle>
                    <DrawerDescription>A quick guide to {place.name}</DrawerDescription>
                </DrawerHeader>

                <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3"
                    style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    {/* Photo placeholder: soft pastel gradient until real images (phase 3) */}
                    <div className="relative flex aspect-[16/10] w-full items-end overflow-hidden rounded-2xl bg-gradient-to-br from-sky-200 via-rose-100 to-amber-100 p-4">
                        <span className="text-foreground/50 flex items-center gap-1.5 text-xs">
                            <ImageIcon className="size-4" aria-hidden />
                            Photo coming soon
                        </span>
                    </div>

                    <h2 className="mt-5 mb-0 text-3xl font-semibold">{place.name}</h2>
                    {subtitle && <p className="text-muted-foreground m-0 mt-1 text-sm">{subtitle}</p>}

                    <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
                        {guide.facts.map((fact) => (
                            <li
                                key={fact.label}
                                className={cn(
                                    'rounded-full border border-black/10 px-3 py-1 text-xs',
                                    guide.placeholder && 'text-muted-foreground border-dashed'
                                )}
                            >
                                {fact.label}
                            </li>
                        ))}
                    </ul>

                    {guide.sections.map((section) => (
                        <section key={section.id} className="mt-7">
                            <h3 className="m-0 text-xl font-semibold">{section.title}</h3>
                            <p
                                className={cn(
                                    'm-0 mt-2 text-[15px] leading-relaxed',
                                    guide.placeholder && 'text-muted-foreground italic'
                                )}
                            >
                                {section.body}
                            </p>
                        </section>
                    ))}

                    {guide.draft && (
                        <p className="text-muted-foreground m-0 mt-10 text-center text-xs">
                            {guide.placeholder
                                ? `The guide to ${place.name} isn't written yet.`
                                : 'Draft guide, written by hand while we design this page.'}
                        </p>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
