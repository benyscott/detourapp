'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import DestinationInfo from '@/components/DestinationInfo';
import DistanceInfo from '@/components/DistanceInfo';
import NavigationBar from '@/components/NavigationBar';
import StopArrivalSheet from '@/components/itineraries/StopArrivalSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useTourRun from '@/hooks/useTourRun';
import { calculateDistance } from '@/lib/geoUtils';
import { ARRIVAL_THRESHOLD_M } from '@/lib/itineraries/runner';
import usePlaceStore from '@/store/placeStore';
import { cn } from '@/lib/utils';

export default function TourOverlay({ itinerary }) {
    const stops = useMemo(
        () =>
            (itinerary?.stops ?? []).filter(
                (stop) => stop?.place?.latitude != null && stop?.place?.longitude != null
            ),
        [itinerary]
    );
    const totalStops = stops.length;
    const tourId = itinerary?.id;

    const { currentIndex, advance, goTo, reset, isComplete } = useTourRun({
        tourId,
        totalStops,
    });

    const setDestination = usePlaceStore((state) => state.setDestination);
    const clearDestination = usePlaceStore((state) => state.clearDestination);
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const geolocationError = usePlaceStore((state) => state.geolocationError);

    const currentStop = !isComplete ? (stops[currentIndex] ?? null) : null;

    useEffect(() => {
        if (!currentStop?.place) {
            clearDestination();
            return;
        }

        setDestination({
            id: currentStop.id,
            name: currentStop.place.name,
            latitude: currentStop.place.latitude,
            longitude: currentStop.place.longitude,
            address: currentStop.place.address ?? null,
        });

        return () => {
            clearDestination();
        };
    }, [currentStop, setDestination, clearDestination]);

    const [arrival, setArrival] = useState({ index: 0, arrived: false });

    useEffect(() => {
        setArrival({ index: currentIndex, arrived: false });
    }, [currentIndex]);

    const meters =
        currentLocation && currentStop?.place
            ? calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  currentStop.place.latitude,
                  currentStop.place.longitude
              )
            : null;

    useEffect(() => {
        if (meters == null) {
            return;
        }

        if (meters > ARRIVAL_THRESHOLD_M) {
            setArrival((prev) => {
                if (prev.index !== currentIndex) {
                    return prev;
                }
                if (!prev.arrived) {
                    return prev;
                }
                return { index: currentIndex, arrived: false };
            });
            return;
        }

        setArrival((prev) => {
            if (prev.index !== currentIndex) {
                return prev;
            }
            if (prev.arrived) {
                return prev;
            }
            return { index: currentIndex, arrived: true };
        });
    }, [currentIndex, meters]);

    const handleAdvance = () => {
        advance();
    };

    const handleReset = () => {
        reset();
    };

    if (totalStops === 0) {
        return (
            <CenteredShell backHref={`/itineraries/${tourId}`} backLabel={itinerary?.title}>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>No stops yet</CardTitle>
                        <CardDescription>
                            This itinerary has no stops with locations. Add some before starting the tour.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href={`/itineraries/${tourId}/edit`}>Add stops</Link>
                        </Button>
                    </CardContent>
                </Card>
            </CenteredShell>
        );
    }

    if (isComplete) {
        return (
            <CenteredShell backHref={`/itineraries/${tourId}`} backLabel={itinerary?.title}>
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Tour complete</CardTitle>
                        <CardDescription>
                            You finished all {totalStops} {totalStops === 1 ? 'stop' : 'stops'} of{' '}
                            {itinerary.title}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href={`/itineraries/${tourId}`}>Back to itinerary</Link>
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            <RotateCcw />
                            Restart tour
                        </Button>
                    </CardContent>
                </Card>
            </CenteredShell>
        );
    }

    const stopNumber = currentIndex + 1;
    const isLastStop = currentIndex === totalStops - 1;
    const arrivalOpen = arrival.index === currentIndex && arrival.arrived;

    return (
        <>
            <NavigationBar className="pointer-events-none">
                <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-3">
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        aria-label="Previous stop"
                        className="shrink-0 rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white"
                        onClick={() => goTo(currentIndex - 1)}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft />
                    </Button>

                    <div className="min-w-0 flex-1 flex justify-center">
                        <DestinationInfo />
                    </div>

                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        aria-label="Next stop"
                        className="shrink-0 rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white"
                        onClick={() => goTo(currentIndex + 1)}
                        disabled={currentIndex >= totalStops - 1}
                    >
                        <ChevronRight />
                    </Button>
                </div>

                <DistanceInfo />

                <div
                    role="tablist"
                    aria-label={`Stop ${stopNumber} of ${totalStops}`}
                    className="pointer-events-auto flex items-center gap-1.5"
                >
                    {stops.map((stop, index) => {
                        const isCurrent = index === currentIndex;
                        return (
                            <button
                                key={stop.id ?? index}
                                type="button"
                                role="tab"
                                aria-selected={isCurrent}
                                aria-label={`Go to stop ${index + 1}${stop?.place?.name ? `: ${stop.place.name}` : ''}`}
                                onClick={() => goTo(index)}
                                className={cn(
                                    'size-2 rounded-full transition-colors',
                                    isCurrent ? 'bg-slate-900' : 'bg-slate-900/30 hover:bg-slate-900/50'
                                )}
                            />
                        );
                    })}
                </div>
            </NavigationBar>

            {geolocationError && (
                <div className="fixed inset-x-4 bottom-6 z-[900] mx-auto max-w-md rounded-lg border border-destructive/40 bg-destructive/20 px-4 py-3 text-sm text-destructive-foreground backdrop-blur-sm">
                    {geolocationError}
                </div>
            )}

            <StopArrivalSheet
                open={arrivalOpen}
                onAdvance={handleAdvance}
                stopName={currentStop?.place?.name}
                stopNote={currentStop?.notes}
                isLastStop={isLastStop}
                stopNumber={stopNumber}
                totalStops={totalStops}
            />
        </>
    );
}

function CenteredShell({ backHref, backLabel, children }) {
    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-background/60 px-6 py-8 backdrop-blur-sm sm:px-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                <Button asChild variant="ghost" className="w-fit">
                    <Link href={backHref}>
                        <ArrowLeft />
                        {backLabel ?? 'Back'}
                    </Link>
                </Button>
                {children}
            </div>
        </div>
    );
}
