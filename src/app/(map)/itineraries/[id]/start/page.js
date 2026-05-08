import { notFound } from 'next/navigation';
import TourOverlay from '@/components/itineraries/TourOverlay';
import { getItinerary } from '@/lib/itineraries/repository';

export const dynamic = 'force-dynamic';

export default async function StartItineraryPage({ params }) {
    const { id } = await params;
    const itinerary = await getItinerary({ id });

    if (!itinerary) {
        notFound();
    }

    return <TourOverlay itinerary={itinerary} />;
}
