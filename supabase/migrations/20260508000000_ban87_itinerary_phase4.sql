-- BAN-87/BAN-89/BAN-85: itinerary builder metadata and stop access.

SET search_path = public, extensions;

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER tours_set_updated_at_before_update
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS tour_stops_tour_order_idx
  ON public.tour_stops (tour_id, order_index);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY tours_select_all ON public.tours
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY tours_insert_all ON public.tours
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY tours_update_all ON public.tours
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY tours_delete_all ON public.tours
  FOR DELETE TO anon, authenticated
  USING (true);

CREATE POLICY tour_stops_select_all ON public.tour_stops
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY tour_stops_insert_all ON public.tour_stops
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY tour_stops_update_all ON public.tour_stops
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY tour_stops_delete_all ON public.tour_stops
  FOR DELETE TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tours TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tour_stops TO anon, authenticated;
