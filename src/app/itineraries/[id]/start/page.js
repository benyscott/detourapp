import { notFound } from 'next/navigation';
import TourRunner from '@/components/itineraries/TourRunner';
import { getItinerary } from '@/lib/itineraries/repository';

export const dynamic = 'force-dynamic';

export default async function StartItineraryPage({ params }) {
  const { id } = await params;
  const itinerary = await getItinerary({ id });

  if (!itinerary) {
    notFound();
  }

  return (
    <main className="dark fixed inset-0 overflow-hidden bg-background text-foreground">
      <TourRunner itinerary={itinerary} />
    </main>
  );
}
