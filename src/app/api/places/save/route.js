import { NextResponse } from 'next/server';
import {
  addPlaceToList,
  findListItem,
  findPlaceIdByProvider,
  getOrCreateFavouritesList,
  removePlaceFromList,
  upsertCanonicalPlace,
} from '@/lib/places/repository';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const externalId = searchParams.get('externalId');

    if (!provider || !externalId) {
      return NextResponse.json(
        { error: 'provider and externalId are required' },
        { status: 400 }
      );
    }

    const placeId = await findPlaceIdByProvider({ provider, externalId });
    if (!placeId) {
      return NextResponse.json({ isFavourited: false });
    }

    const listId = await getOrCreateFavouritesList({ userId: null });
    const listItemId = await findListItem({ listId, placeId });

    return NextResponse.json({
      isFavourited: Boolean(listItemId),
      listItemId,
      placeId,
      listId,
    });
  } catch (error) {
    console.error('[API] Check favourite status failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check favourite status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

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

export async function DELETE(request) {
  try {
    let provider = null;
    let externalId = null;
    let listId = null;

    try {
      const body = await request.json();
      provider = body?.provider ?? null;
      externalId = body?.externalId ?? null;
      listId = body?.listId ?? null;
    } catch {
      // No JSON body provided; fall back to query string
    }

    if (!provider || !externalId) {
      const { searchParams } = new URL(request.url);
      provider = provider ?? searchParams.get('provider');
      externalId = externalId ?? searchParams.get('externalId');
      listId = listId ?? searchParams.get('listId');
    }

    if (!provider || !externalId) {
      return NextResponse.json(
        { error: 'provider and externalId are required' },
        { status: 400 }
      );
    }

    const placeId = await findPlaceIdByProvider({ provider, externalId });
    if (!placeId) {
      return NextResponse.json({ removed: false });
    }

    const resolvedListId = listId ?? (await getOrCreateFavouritesList({ userId: null }));
    const { removed } = await removePlaceFromList({ listId: resolvedListId, placeId });

    return NextResponse.json({
      removed,
      placeId,
      listId: resolvedListId,
    });
  } catch (error) {
    console.error('[API] Remove favourite failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove favourite',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
