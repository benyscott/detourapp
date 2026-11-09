import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Itinerary playback lives on the root map at `/?tour=<id>` (BAN-135). */
export default async function StartItineraryPage({ params }) {
    const { id } = await params;
    redirect(`/?tour=${encodeURIComponent(id)}`);
}
