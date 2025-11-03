import { LocationProvider, Place, PlaceDetails } from '../locationService';

/**
 * Google Places API Provider
 * Implements location services using Google Places API
 */
export class GooglePlacesProvider extends LocationProvider {
  constructor() {
    super();
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!this.apiKey) {
      console.error('[GooglePlaces] ❌ API key not configured!');
      console.error('[GooglePlaces] Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to .env.local');
    } else {
      console.log('[GooglePlaces] ✓ API key configured');
    }
  }

    /**
     * Search places using Text Search API
     * Returns coordinates directly - no need to fetch details for each result
     */
    async searchPlaces(query, options = {}) {
        const { latitude, longitude, radius = 5000, countryCode } = options;

        if (!this.apiKey) {
            throw new Error('Google Places API key not configured');
        }

        console.log('[GooglePlaces] Text search:', query, {
            latitude,
            longitude,
            radius,
            countryCode,
        });

        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.append('query', query);
        url.searchParams.append('key', this.apiKey);

        // Add location bias if available
        if (latitude && longitude) {
            url.searchParams.append('location', `${latitude},${longitude}`);
            url.searchParams.append('radius', radius.toString());
        }

        // Restrict to country if provided (region biasing)
        if (countryCode) {
            url.searchParams.append('region', countryCode.toLowerCase());
        }

        try {
            const urlString = url.toString();
            console.log('[GooglePlaces] Text Search URL:', urlString.replace(/key=[^&]+/, 'key=HIDDEN'));
            
            const response = await fetch(urlString);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GooglePlaces] HTTP error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            console.log('[GooglePlaces] Text search response:', {
                status: data.status,
                results_count: data.results?.length || 0,
                error_message: data.error_message,
            });

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('[GooglePlaces] API error:', data.status, data.error_message);
                
                if (data.status === 'REQUEST_DENIED') {
                    console.error('[GooglePlaces] ❌ REQUEST_DENIED - Check:');
                    console.error('  1. Places API is enabled in Google Cloud Console');
                    console.error('  2. API key is valid');
                }
                
                throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            }

            if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
                console.log('[GooglePlaces] Zero results');
                return [];
            }

            // Transform results to Place objects (coordinates included!)
            const places = data.results.map(result => {
                const location = result.geometry?.location;
                const lat = location?.lat;
                const lng = location?.lng;
                
                // Calculate distance if user location provided
                let distance = null;
                if (latitude && longitude && lat && lng) {
                    distance = this.calculateDistance(latitude, longitude, lat, lng);
                }

                return new Place({
                    id: result.place_id,
                    name: result.name,
                    address: result.formatted_address || result.vicinity || '',
                    latitude: lat,
                    longitude: lng,
                    category: result.types?.[0] || 'place',
                    types: result.types || [],
                    distance,
                    providerName: 'google',
                    rawData: result,
                });
            });

            // Filter by radius if coordinates provided
            if (latitude && longitude) {
                const filtered = places.filter(place => 
                    place.latitude && 
                    place.longitude && 
                    place.distance !== null && 
                    place.distance <= radius
                );
                console.log('[GooglePlaces] Filtered:', filtered.length, '/', places.length, 'places within', radius, 'm');
                return filtered;
            }

            console.log('[GooglePlaces] Returning', places.length, 'places');
            return places;
        } catch (error) {
            console.error('[GooglePlaces] Search failed:', error);
            throw error;
        }
    }

    /**
     * Get place details using Place Details API
     */
  async getPlaceDetails(placeId, options = {}) {
    const { sessionToken } = options;

    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('fields', 'name,formatted_address,geometry,types,rating,price_level,opening_hours,formatted_phone_number,website,photos,reviews');

    if (sessionToken) {
      url.searchParams.append('sessiontoken', sessionToken);
    }

    try {
      console.log('[GooglePlaces] Details URL:', url.toString().replace(/key=[^&]+/, 'key=HIDDEN'));
      const response = await fetch(url.toString());
      const data = await response.json();

      console.log('[GooglePlaces] Details response:', {
        status: data.status,
        error_message: data.error_message,
        has_result: !!data.result,
      });

      if (data.status !== 'OK') {
        console.error('[GooglePlaces] Details API error:', data.status, data.error_message);
        throw new Error(`Google Places Details API error: ${data.status} - ${data.error_message || ''}`);
      }

            const result = data.result;
            const location = result.geometry?.location;

            return new PlaceDetails({
                id: placeId,
                name: result.name,
                address: result.formatted_address,
                latitude: location?.lat,
                longitude: location?.lng,
                category: result.types?.[0] || 'place',
                types: result.types || [],
                providerName: 'google',
                rawData: result,
                // Extended details
                phone: result.formatted_phone_number,
                website: result.website,
                rating: result.rating,
                priceLevel: result.price_level,
                openingHours: result.opening_hours,
                photos: result.photos?.map(photo => ({
                    reference: photo.photo_reference,
                    width: photo.width,
                    height: photo.height,
                })) || [],
                reviews: result.reviews?.slice(0, 3) || [],
            });
        } catch (error) {
            console.error('[GooglePlaces] Failed to get details:', error);
            throw error;
        }
    }

    /**
     * Search nearby places using Nearby Search API
     */
    async searchNearby(options = {}) {
        const { latitude, longitude, radius = 5000, type, countryCode } = options;

        if (!this.apiKey) {
            throw new Error('Google Places API key not configured');
        }

        if (!latitude || !longitude) {
            throw new Error('Latitude and longitude are required for nearby search');
        }

        console.log('[GooglePlaces] Nearby search:', options);

        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.append('location', `${latitude},${longitude}`);
        url.searchParams.append('radius', radius.toString());
        url.searchParams.append('key', this.apiKey);

        if (type) {
            url.searchParams.append('type', type);
        }

        try {
            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('[GooglePlaces] Nearby API error:', data.status);
                throw new Error(`Google Places Nearby API error: ${data.status}`);
            }

            if (data.status === 'ZERO_RESULTS' || !data.results) {
                console.log('[GooglePlaces] No nearby results found');
                return [];
            }

            // Transform results to Place objects
            const places = data.results.map(result => {
                const location = result.geometry?.location;

                // Calculate distance
                let distance = null;
                if (location) {
                    distance = this.calculateDistance(
                        latitude,
                        longitude,
                        location.lat,
                        location.lng
                    );
                }

                return new Place({
                    id: result.place_id,
                    name: result.name,
                    address: result.vicinity || result.formatted_address,
                    latitude: location?.lat,
                    longitude: location?.lng,
                    category: result.types?.[0] || 'place',
                    types: result.types || [],
                    distance,
                    providerName: 'google',
                    rawData: result,
                });
            });

            // Sort by distance
            places.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

            return places.slice(0, 10); // Return top 10
        } catch (error) {
            console.error('[GooglePlaces] Nearby search failed:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }
}

