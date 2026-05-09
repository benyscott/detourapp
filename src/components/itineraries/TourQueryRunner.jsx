'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TourOverlay from '@/components/itineraries/TourOverlay';

/**
 * Loads an itinerary when `/?tour=<id>` so the tour runs on the root map layout (BAN-135).
 */
export default function TourQueryRunner({ tourId }) {
    const router = useRouter();
    const [itinerary, setItinerary] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tourId) {
            queueMicrotask(() => {
                setItinerary(null);
                setError(null);
                setIsLoading(false);
            });
            return;
        }

        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            setItinerary(null);

            try {
                const response = await fetch(`/api/itineraries/${tourId}`);
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.error || 'Itinerary not found');
                }

                if (!cancelled) {
                    setItinerary(payload.itinerary ?? null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Failed to load tour');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [tourId]);

    if (!tourId) {
        return null;
    }

    if (isLoading) {
        return (
            <div
                className="fixed inset-x-0 top-0 z-[150] flex justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]"
                role="status"
                aria-live="polite"
            >
                <p className="text-muted-foreground rounded-full bg-background/80 px-4 py-2 text-sm backdrop-blur-md">
                    Loading tour…
                </p>
            </div>
        );
    }

    if (error || !itinerary) {
        return (
            <div
                className="fixed inset-x-0 top-0 z-[150] flex flex-col items-center gap-2 px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]"
                role="alert"
            >
                <p className="rounded-lg bg-destructive/15 px-4 py-2 text-center text-sm text-destructive">
                    {error || 'Tour unavailable'}
                </p>
                <button
                    type="button"
                    className="text-primary underline text-sm font-medium"
                    onClick={() => router.replace('/', { scroll: false })}
                >
                    Back to map
                </button>
            </div>
        );
    }

    return <TourOverlay itinerary={itinerary} />;
}
