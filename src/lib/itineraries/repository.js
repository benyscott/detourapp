import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { upsertCanonicalPlace } from '@/lib/places/repository';

const ITINERARY_SELECT = `
  id,
  title,
  description,
  created_by,
  is_published,
  slug,
  created_at,
  updated_at
`;

const ITINERARY_WITH_STOPS_SELECT = `
  ${ITINERARY_SELECT},
  stops:tour_stops (
    id,
    tour_id,
    place_id,
    order_index,
    notes,
    created_at,
    place:places (
      id,
      name,
      category,
      latitude,
      longitude,
      description,
      address,
      provider_ids,
      provider_data
    )
  )
`;

const sanitizeSlugPart = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const createSlug = (title) => {
  const base = sanitizeSlugPart(title) || 'itinerary';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
};

const normalizeItinerary = (itinerary) => {
  if (!itinerary) {
    return null;
  }

  const stops = [...(itinerary.stops ?? [])].sort(
    (left, right) => left.order_index - right.order_index
  );

  return {
    ...itinerary,
    stops,
  };
};

export const listItineraries = async () => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tours')
    .select(ITINERARY_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const createItinerary = async ({ title, description = null, isPublished = false }) => {
  if (!title?.trim()) {
    throw new Error('title is required');
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tours')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      is_published: Boolean(isPublished),
      slug: createSlug(title),
    })
    .select(ITINERARY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getItinerary = async ({ id }) => {
  if (!id) {
    throw new Error('id is required');
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tours')
    .select(ITINERARY_WITH_STOPS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeItinerary(data);
};

export const updateItinerary = async ({ id, title, description, isPublished }) => {
  if (!id) {
    throw new Error('id is required');
  }

  const updates = {};
  if (title !== undefined) {
    if (!title?.trim()) {
      throw new Error('title is required');
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }
  if (isPublished !== undefined) {
    updates.is_published = Boolean(isPublished);
  }

  if (Object.keys(updates).length === 0) {
    return getItinerary({ id });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tours')
    .update(updates)
    .eq('id', id)
    .select(ITINERARY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteItinerary = async ({ id }) => {
  if (!id) {
    throw new Error('id is required');
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('tours').delete().eq('id', id);

  if (error) {
    throw error;
  }

  return { id };
};

const getNextStopOrderIndex = async ({ supabase, itineraryId }) => {
  const { data, error } = await supabase
    .from('tour_stops')
    .select('order_index')
    .eq('tour_id', itineraryId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? data.order_index + 1 : 0;
};

export const addStopToItinerary = async ({ itineraryId, place, provider, externalId, note = null }) => {
  if (!itineraryId) {
    throw new Error('itineraryId is required');
  }

  const canonicalPlace =
    place?.source === 'saved' && place.id
      ? { placeId: place.id, isNewPlace: false }
      : await upsertCanonicalPlace({
          provider: provider ?? place?.provider,
          externalId: externalId ?? place?.id,
          place: {
            name: place?.name,
            latitude: place?.latitude,
            longitude: place?.longitude,
            category: place?.category ?? 'place',
            address: place?.address ?? place?.place_name ?? null,
            description: place?.description ?? null,
            rawData: place?.rawData ?? place?.raw_data ?? {},
          },
        });

  const supabase = createServiceRoleClient();
  const orderIndex = await getNextStopOrderIndex({ supabase, itineraryId });
  const { data, error } = await supabase
    .from('tour_stops')
    .insert({
      tour_id: itineraryId,
      place_id: canonicalPlace.placeId,
      order_index: orderIndex,
      notes: note?.trim() || null,
    })
    .select(`
      id,
      tour_id,
      place_id,
      order_index,
      notes,
      created_at,
      place:places (
        id,
        name,
        category,
        latitude,
        longitude,
        description,
        address,
        provider_ids,
        provider_data
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const reorderItineraryStops = async ({ itineraryId, stopIds }) => {
  if (!itineraryId) {
    throw new Error('itineraryId is required');
  }

  if (!Array.isArray(stopIds)) {
    throw new Error('stopIds must be an array');
  }

  const supabase = createServiceRoleClient();
  const updates = stopIds.map((stopId, orderIndex) =>
    supabase
      .from('tour_stops')
      .update({ order_index: orderIndex })
      .eq('tour_id', itineraryId)
      .eq('id', stopId)
  );

  const results = await Promise.all(updates);
  const failed = results.find(({ error }) => error);
  if (failed?.error) {
    throw failed.error;
  }

  return getItinerary({ id: itineraryId });
};

export const updateItineraryStop = async ({ itineraryId, stopId, note }) => {
  if (!itineraryId || !stopId) {
    throw new Error('itineraryId and stopId are required');
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('tour_stops')
    .update({ notes: note?.trim() || null })
    .eq('tour_id', itineraryId)
    .eq('id', stopId)
    .select('id, tour_id, place_id, order_index, notes, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const removeItineraryStop = async ({ itineraryId, stopId }) => {
  if (!itineraryId || !stopId) {
    throw new Error('itineraryId and stopId are required');
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('tour_stops')
    .delete()
    .eq('tour_id', itineraryId)
    .eq('id', stopId);

  if (error) {
    throw error;
  }

  return { stopId };
};
