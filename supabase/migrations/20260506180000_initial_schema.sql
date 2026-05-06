-- BAN-63: initial schema (places, tours, tour_stops). PostGIS for BAN-72.

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location geography(Point, 4326),
  description text,
  address text,
  created_at timestamp DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.places_set_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER places_set_location_before_insert_update
  BEFORE INSERT OR UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.places_set_location();

CREATE INDEX places_location_idx ON public.places USING gist (location);

CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  description text,
  created_by uuid,
  is_published boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE public.tour_stops (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tour_id uuid REFERENCES public.tours (id) ON DELETE CASCADE,
  place_id uuid REFERENCES public.places (id),
  order_index integer NOT NULL,
  notes text,
  created_at timestamp DEFAULT now()
);
