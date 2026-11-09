import Link from 'next/link';
import { Map, Pencil, Play } from 'lucide-react';
import CopyShareLinkButton from '@/components/itineraries/CopyShareLinkButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ItineraryDetail({ itinerary }) {
  const stops = itinerary.stops ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-xl border bg-card/80 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Itinerary
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">{itinerary.title}</h1>
          {itinerary.description && (
            <p className="text-base text-muted-foreground">{itinerary.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {stops.length} {stops.length === 1 ? 'stop' : 'stops'} ·{' '}
            {itinerary.is_published ? 'Published' : 'Draft'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/itineraries/${itinerary.id}/start`}>
              <Play />
              Start
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/itineraries/${itinerary.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          <CopyShareLinkButton />
        </div>
      </section>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="size-5" />
            Stops
          </CardTitle>
          <CardDescription>Review the ordered route before starting.</CardDescription>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              This itinerary does not have stops yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {stops.map((stop, index) => (
                <li key={stop.id} className="rounded-xl border bg-background/40 p-4">
                  <div className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{stop.place?.name ?? 'Untitled place'}</h3>
                      {stop.place?.address && (
                        <p className="truncate text-sm text-muted-foreground">{stop.place.address}</p>
                      )}
                      {stop.notes && <p className="mt-2 text-sm">{stop.notes}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
