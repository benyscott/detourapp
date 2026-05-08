import { createServiceRoleClient } from '@/utils/supabase/service-role';

const PROVIDER_KEYS = {
  google: 'gmaps',
  gmaps: 'gmaps',
  mapbox: 'mapbox',
  osm: 'osm',
};

const resolveProviderKey = (provider) => {
  const providerKey = PROVIDER_KEYS[provider];
  if (!providerKey) {
    throw new Error(`Unsupported provider "${provider}"`);
  }

  return providerKey;
};

const mergeProviderObject = (currentValue, providerKey, providerValue) => {
  const baseObject =
    currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)
      ? currentValue
      : {};

  return {
    ...baseObject,
    [providerKey]: providerValue,
  };
};

export const upsertCanonicalPlace = async ({ provider, externalId, place }) => {
  if (!externalId) {
    throw new Error('externalId is required');
  }

  if (!place?.name) {
    throw new Error('place.name is required');
  }

  if (place.latitude == null || place.longitude == null) {
    throw new Error('place.latitude and place.longitude are required');
  }

  const providerKey = resolveProviderKey(provider);
  const supabase = createServiceRoleClient();

  const { data: existingPlace, error: existingPlaceError } = await supabase
    .from('places')
    .select('id, provider_ids, provider_data')
    .contains('provider_ids', { [providerKey]: externalId })
    .maybeSingle();

  if (existingPlaceError) {
    throw existingPlaceError;
  }

  const providerIds = mergeProviderObject(existingPlace?.provider_ids, providerKey, externalId);
  const providerData = mergeProviderObject(existingPlace?.provider_data, providerKey, place.rawData ?? {});

  if (existingPlace) {
    const { data: updatedPlace, error: updatePlaceError } = await supabase
      .from('places')
      .update({
        name: place.name,
        category: place.category ?? 'place',
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address ?? null,
        description: place.description ?? null,
        provider_ids: providerIds,
        provider_data: providerData,
        last_enriched_at: new Date().toISOString(),
      })
      .eq('id', existingPlace.id)
      .select('id')
      .single();

    if (updatePlaceError) {
      throw updatePlaceError;
    }

    return {
      placeId: updatedPlace.id,
      isNewPlace: false,
    };
  }

  const { data: insertedPlace, error: insertPlaceError } = await supabase
    .from('places')
    .insert({
      name: place.name,
      category: place.category ?? 'place',
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address ?? null,
      description: place.description ?? null,
      provider_ids: providerIds,
      provider_data: providerData,
      last_enriched_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertPlaceError) {
    throw insertPlaceError;
  }

  return {
    placeId: insertedPlace.id,
    isNewPlace: true,
  };
};

export const getOrCreateFavouritesList = async ({ userId = null }) => {
  const supabase = createServiceRoleClient();

  const { data: existingList, error: existingListError } = await supabase
    .from('place_lists')
    .select('id')
    .eq('name', 'Favourites')
    .is('user_id', userId)
    .maybeSingle();

  if (existingListError) {
    throw existingListError;
  }

  if (existingList) {
    return existingList.id;
  }

  const { data: createdList, error: createListError } = await supabase
    .from('place_lists')
    .insert({
      user_id: userId,
      name: 'Favourites',
      slug: 'favourites',
      is_default_favourites: true,
    })
    .select('id')
    .single();

  if (createListError) {
    throw createListError;
  }

  return createdList.id;
};

export const addPlaceToList = async ({ listId, placeId, note = null }) => {
  const supabase = createServiceRoleClient();

  const { data: existingItem, error: existingItemError } = await supabase
    .from('place_list_items')
    .select('id')
    .eq('list_id', listId)
    .eq('place_id', placeId)
    .maybeSingle();

  if (existingItemError) {
    throw existingItemError;
  }

  if (existingItem) {
    return {
      listItemId: existingItem.id,
      alreadyInList: true,
    };
  }

  const { data: insertedItem, error: insertItemError } = await supabase
    .from('place_list_items')
    .insert({
      list_id: listId,
      place_id: placeId,
      note,
    })
    .select('id')
    .single();

  if (insertItemError) {
    throw insertItemError;
  }

  return {
    listItemId: insertedItem.id,
    alreadyInList: false,
  };
};
