import { useEffect, useRef } from 'react';
import { calculateDistance } from '@/lib/geoUtils';
import usePlaceStore from '@/store/placeStore';
import useVisitStore from '@/store/visitStore';

/** Look the town up again only after moving this far (not on every GPS update) */
const RELOOKUP_AFTER_M = 2000;

/**
 * Finds which town/city you're in (Mapbox reverse geocoding, type "place") when the app
 * opens and whenever you've moved 2 km, and records the visit.
 */
export default function useCurrentPlace() {
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const arriveAt = useVisitStore((state) => state.arriveAt);
    const lastLookupRef = useRef(null);
    const inflightRef = useRef(false);

    useEffect(() => {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!currentLocation || !token || inflightRef.current) return;

        const last = lastLookupRef.current;
        if (
            last &&
            calculateDistance(last.latitude, last.longitude, currentLocation.latitude, currentLocation.longitude) <
                RELOOKUP_AFTER_M
        ) {
            return;
        }

        inflightRef.current = true;
        const { latitude, longitude } = currentLocation;
        const params = new URLSearchParams({
            longitude: String(longitude),
            latitude: String(latitude),
            types: 'place',
            access_token: token,
        });

        fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`)
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
            .then((data) => {
                const properties = data.features?.[0]?.properties;
                if (!properties?.mapbox_id) return;
                lastLookupRef.current = { latitude, longitude };
                arriveAt({
                    id: properties.mapbox_id,
                    name: properties.name,
                    wikidataId: properties.context?.place?.wikidata_id ?? null,
                    region: properties.context?.region?.name ?? null,
                    country: properties.context?.country?.name ?? null,
                    countryCode: properties.context?.country?.country_code ?? null,
                });
            })
            .catch((error) => console.warn('[CurrentPlace] reverse geocoding failed', error))
            .finally(() => {
                inflightRef.current = false;
            });
    }, [currentLocation, arriveAt]);
}
