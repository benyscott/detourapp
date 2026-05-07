import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getItinerary } from '@/lib/itineraries/repository';

export const dynamic = 'force-dynamic';

export default async function StartItineraryPage({ params }) {
  const { id } = await params;
  const itinerary = await getItinerary({ id });

  if (!itinerary) {
    notFound();
  }

  return (
    <main className="dark fixed inset-0 overflow-y-auto bg-background px-6 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link href={`/itineraries/${id}`}>
            <ArrowLeft />
            {itinerary.title}
          </Link>
        </Button>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Start is coming next</CardTitle>
            <CardDescription>
              Phase 4 prepares the itinerary overview. The guided tour-running experience lands in
              a later phase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/itineraries/${id}`}>Review itinerary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
