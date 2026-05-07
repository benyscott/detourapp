import { NextResponse } from 'next/server';
import {
  addPlaceToList,
  getOrCreateFavouritesList,
  upsertCanonicalPlace,
} from '@/lib/places/repository';

export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, externalId, place, listId, note } = body ?? {};

    if (!provider || !externalId || !place) {
      return NextResponse.json(
        { error: 'provider, externalId and place are required' },
        { status: 400 }
      );
    }

    const { placeId } = await upsertCanonicalPlace({
      provider,
      externalId,
      place,
    });

    const resolvedListId = listId ?? (await getOrCreateFavouritesList({ userId: null }));
    const { listItemId, alreadyInList } = await addPlaceToList({
      listId: resolvedListId,
      placeId,
      note,
    });

    return NextResponse.json({
      placeId,
      listId: resolvedListId,
      listItemId,
      alreadyInList,
    });
  } catch (error) {
    console.error('[API] Save place failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to save place',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
