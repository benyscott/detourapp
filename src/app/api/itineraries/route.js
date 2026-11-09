import { NextResponse } from 'next/server';
import { createItinerary, listItineraries } from '@/lib/itineraries/repository';

export async function GET() {
  try {
    const itineraries = await listItineraries();
    return NextResponse.json({ itineraries });
  } catch (error) {
    console.error('[API] Itinerary list failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description = null, isPublished = false } = body ?? {};

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const itinerary = await createItinerary({ title, description, isPublished });
    return NextResponse.json({ itinerary }, { status: 201 });
  } catch (error) {
    console.error('[API] Itinerary creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary', details: error.message },
      { status: 500 }
    );
  }
}
