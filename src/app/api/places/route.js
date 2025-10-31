import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Mapbox access token is not configured' },
      { status: 500 }
    );
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${accessToken}&limit=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Mapbox API error' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Transform Mapbox results to our format
    const results = data.features.map((feature) => ({
      id: feature.id,
      name: feature.text || feature.place_name,
      place_name: feature.place_name,
      coordinates: feature.center, // [lng, lat]
      latitude: feature.center[1],
      longitude: feature.center[0],
      context: feature.context,
    }));
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in places API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

