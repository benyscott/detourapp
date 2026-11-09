'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import StopList from '@/components/itineraries/StopList';
import StopSearch from '@/components/itineraries/StopSearch';
import { Button } from '@/components/ui/button';

export default function ItineraryBuilder({ itinerary }) {
  const [stops, setStops] = useState(itinerary.stops ?? []);

  const handleStopAdded = (stop) => {
    setStops((currentStops) => [...currentStops, stop].sort(
      (left, right) => left.order_index - right.order_index
    ));
  };

  const handleStopsReordered = (nextStops) => {
    setStops(nextStops);
  };

  const handleStopUpdated = (stopId, note) => {
    setStops((currentStops) =>
      currentStops.map((stop) => (stop.id === stopId ? { ...stop, notes: note } : stop))
    );
  };

  const handleStopRemoved = (stopId) => {
    setStops((currentStops) => currentStops.filter((stop) => stop.id !== stopId));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card/80 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Editing itinerary
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="text-sm text-muted-foreground">{itinerary.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {itinerary.is_published ? 'Published and shareable' : 'Draft'}
            </p>
          </div>

          <Button asChild variant="secondary">
            <Link href={`/itineraries/${itinerary.id}`}>
              <Eye />
              Preview
            </Link>
          </Button>
        </div>
      </section>

      <StopSearch itineraryId={itinerary.id} onStopAdded={handleStopAdded} />
      <StopList
        itineraryId={itinerary.id}
        stops={stops}
        onStopsReordered={handleStopsReordered}
        onStopUpdated={handleStopUpdated}
        onStopRemoved={handleStopRemoved}
      />
    </div>
  );
}
