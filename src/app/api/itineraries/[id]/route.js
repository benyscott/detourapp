import { NextResponse } from 'next/server';
import {
  deleteItinerary,
  getItinerary,
  updateItinerary,
} from '@/lib/itineraries/repository';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const itinerary = await getItinerary({ id });

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('[API] Itinerary fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const itinerary = await updateItinerary({
      id,
      title: body?.title,
      description: body?.description,
      isPublished: body?.isPublished,
    });

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('[API] Itinerary update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await deleteItinerary({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Itinerary delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary', details: error.message },
      { status: 500 }
    );
  }
}
