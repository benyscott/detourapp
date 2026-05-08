import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listItineraries } from '@/lib/itineraries/repository';

export const dynamic = 'force-dynamic';

export default async function ItinerariesPage() {
  const itineraries = await listItineraries();

  return (
    <main className="fixed inset-0 overflow-y-auto bg-background px-6 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/">
              <ArrowLeft />
              Compass
            </Link>
          </Button>

          <Button asChild>
            <Link href="/itineraries/new">
              <Plus />
              New
            </Link>
          </Button>
        </div>

        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Tour builder
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Itineraries</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and share ordered tours of saved or searched places.
          </p>
        </header>

        {itineraries.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardHeader>
              <CardTitle>No itineraries yet</CardTitle>
              <CardDescription>Start with a title, then add places as stops.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/itineraries/new">Create itinerary</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{itinerary.title}</CardTitle>
                  <CardDescription>
                    {itinerary.description || 'No description yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/itineraries/${itinerary.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/itineraries/${itinerary.id}/edit`}>Edit</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
