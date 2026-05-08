'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, RotateCcw } from 'lucide-react';
import Compass from '@/components/Compass';
import DistanceInfo from '@/components/DistanceInfo';
import StopArrivalSheet from '@/components/itineraries/StopArrivalSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useGeolocation from '@/hooks/useGeolocation';
import useNavigation from '@/hooks/useNavigation';
import useTourRun from '@/hooks/useTourRun';
import { calculateDistance } from '@/lib/geoUtils';
import { ARRIVAL_THRESHOLD_M } from '@/lib/itineraries/runner';
import usePlaceStore from '@/store/placeStore';

export default function TourRunner({ itinerary }) {
  const stops = useMemo(
    () => (itinerary?.stops ?? []).filter((stop) => stop?.place?.latitude != null && stop?.place?.longitude != null),
    [itinerary]
  );
  const totalStops = stops.length;
  const tourId = itinerary?.id;

  const { currentIndex, advance, reset, isComplete } = useTourRun({
    tourId,
    totalStops,
  });

  const { error: geolocationError } = useGeolocation(true);
  useNavigation();

  const setDestination = usePlaceStore((state) => state.setDestination);
  const clearDestination = usePlaceStore((state) => state.clearDestination);
  const currentLocation = usePlaceStore((state) => state.currentLocation);

  const currentStop = !isComplete ? stops[currentIndex] ?? null : null;

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

  if (arrival.index !== currentIndex) {
    setArrival({ index: currentIndex, arrived: false });
  }

  const meters =
    currentLocation && currentStop?.place
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          currentStop.place.latitude,
          currentStop.place.longitude
        )
      : null;

  if (
    arrival.index === currentIndex &&
    !arrival.arrived &&
    meters != null &&
    meters <= ARRIVAL_THRESHOLD_M
  ) {
    setArrival({ index: currentIndex, arrived: true });
  }

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
              You finished all {totalStops} {totalStops === 1 ? 'stop' : 'stops'} of {itinerary.title}.
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
      <Button
        asChild
        variant="ghost"
        size="icon"
        aria-label="Back to itinerary"
        className="fixed left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-[1000] rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
      >
        <Link href={`/itineraries/${tourId}`}>
          <ArrowLeft />
        </Link>
      </Button>

      <div className="top-bar pointer-events-none">
        <p className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
          Stop {stopNumber} of {totalStops}
        </p>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-white drop-shadow">
          <MapPin className="size-4" />
          {currentStop?.place?.name ?? 'Untitled stop'}
        </h1>
        <DistanceInfo />
      </div>

      <Compass />

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8 sm:px-8">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={backHref}>
          <ArrowLeft />
          {backLabel ?? 'Back'}
        </Link>
      </Button>
      {children}
    </div>
  );
}
