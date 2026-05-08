import { NextResponse } from 'next/server';
import {
  removeItineraryStop,
  updateItineraryStop,
} from '@/lib/itineraries/repository';

export async function PATCH(request, { params }) {
  try {
    const { id, stopId } = await params;
    const body = await request.json();
    const stop = await updateItineraryStop({
      itineraryId: id,
      stopId,
      note: body?.note,
    });

    return NextResponse.json({ stop });
  } catch (error) {
    console.error('[API] Itinerary stop update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update stop', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id, stopId } = await params;
    await removeItineraryStop({ itineraryId: id, stopId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Itinerary stop delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to remove stop', details: error.message },
      { status: 500 }
    );
  }
}
