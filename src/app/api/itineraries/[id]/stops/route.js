import { NextResponse } from 'next/server';
import {
  addStopToItinerary,
  reorderItineraryStops,
} from '@/lib/itineraries/repository';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { place, provider, externalId, note = null } = body ?? {};

    if (!place) {
      return NextResponse.json({ error: 'place is required' }, { status: 400 });
    }

    const stop = await addStopToItinerary({
      itineraryId: id,
      place,
      provider,
      externalId,
      note,
    });

    return NextResponse.json({ stop }, { status: 201 });
  } catch (error) {
    console.error('[API] Itinerary stop creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to add stop', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stopIds } = body ?? {};

    if (!Array.isArray(stopIds)) {
      return NextResponse.json({ error: 'stopIds must be an array' }, { status: 400 });
    }

    const itinerary = await reorderItineraryStops({ itineraryId: id, stopIds });
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('[API] Itinerary stop reorder failed:', error);
    return NextResponse.json(
      { error: 'Failed to reorder stops', details: error.message },
      { status: 500 }
    );
  }
}
