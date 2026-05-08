import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ItineraryDetail from '@/components/itineraries/ItineraryDetail';
import { Button } from '@/components/ui/button';
import { getItinerary } from '@/lib/itineraries/repository';

export const dynamic = 'force-dynamic';

export default async function ItineraryDetailPage({ params }) {
  const { id } = await params;
  const itinerary = await getItinerary({ id });

  if (!itinerary) {
    notFound();
  }

  return (
    <main className="fixed inset-0 overflow-y-auto bg-background px-6 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/itineraries">
            <ArrowLeft />
            Itineraries
          </Link>
        </Button>

        <ItineraryDetail itinerary={itinerary} />
      </div>
    </main>
  );
}
