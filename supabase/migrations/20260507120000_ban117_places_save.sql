-- BAN-117: saved places and provider identifiers

SET search_path = public, extensions;

-- Keep mutable provider identity + enrichment payload by provider.
ALTER TABLE public.places
  ADD COLUMN provider_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN provider_data jsonb,
  ADD COLUMN last_enriched_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.places
  ADD CONSTRAINT places_provider_ids_object_check
  CHECK (jsonb_typeof(provider_ids) = 'object');

CREATE UNIQUE INDEX places_provider_gmaps_idx
  ON public.places ((provider_ids->>'gmaps'))
  WHERE provider_ids ? 'gmaps';

CREATE UNIQUE INDEX places_provider_mapbox_idx
  ON public.places ((provider_ids->>'mapbox'))
  WHERE provider_ids ? 'mapbox';

CREATE INDEX places_provider_ids_gin
  ON public.places USING gin (provider_ids jsonb_path_ops);

CREATE TABLE public.place_lists (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  slug text,
  is_default_favourites boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX place_lists_user_name_unique_idx
  ON public.place_lists ((coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)), (lower(name)));

CREATE TABLE public.place_list_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  list_id uuid NOT NULL REFERENCES public.place_lists (id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places (id) ON DELETE CASCADE,
  note text,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, place_id)
);

CREATE INDEX place_list_items_list_position_idx
  ON public.place_list_items (list_id, position);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER places_set_updated_at_before_update
  BEFORE UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER place_lists_set_updated_at_before_update
  BEFORE UPDATE ON public.place_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- BAN-117 auth_stub: keep policies permissive until auth-backed ownership/RLS lands.
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY places_select_all ON public.places
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY places_insert_all ON public.places
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY places_update_all ON public.places
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY place_lists_select_all ON public.place_lists
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY place_lists_insert_all ON public.place_lists
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY place_lists_update_all ON public.place_lists
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY place_lists_delete_all ON public.place_lists
  FOR DELETE TO anon, authenticated
  USING (true);

CREATE POLICY place_list_items_select_all ON public.place_list_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY place_list_items_insert_all ON public.place_list_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY place_list_items_delete_all ON public.place_list_items
  FOR DELETE TO anon, authenticated
  USING (true);

-- New Data API behavior may require explicit table grants in some projects.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.places TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.place_lists TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.place_list_items TO anon, authenticated;
