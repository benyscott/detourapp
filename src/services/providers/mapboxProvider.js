import { LocationProvider, Place, PlaceDetails } from '../locationService';

/**
 * Mapbox Geocoding API Provider
 * Implements location services using Mapbox Geocoding API
 */
export class MapboxProvider extends LocationProvider {
  constructor() {
    super();
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!this.accessToken) {
      console.warn('[Mapbox] Access token not configured');
    }
  }

  /**
   * Search places using Mapbox Geocoding API
   */
  async searchPlaces(query, options = {}) {
    const { latitude, longitude, radius = 5000, countryCode } = options;

    if (!this.accessToken) {
      throw new Error('Mapbox access token not configured');
    }

    console.log('[Mapbox] Searching:', query, options);

    const encodedQuery = encodeURIComponent(query);
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${this.accessToken}&limit=10&types=poi,address,place,locality&fuzzyMatch=true&autocomplete=true`;

    // Add proximity bias
    if (latitude && longitude) {
      url += `&proximity=${longitude},${latitude}`;
    }

    // Add country filter
    if (countryCode) {
      url += `&country=${countryCode.toLowerCase()}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.log('[Mapbox] No results found');
        return [];
      }

      // Transform features to Place objects
      const places = data.features.map(feature => {
        const [lng, lat] = feature.center;
        
        // Calculate distance if user location provided
        let distance = null;
        if (latitude && longitude) {
          distance = this.calculateDistance(latitude, longitude, lat, lng);
        }

        // Extract country code from context
        const countryContext = feature.context?.find(ctx => ctx.id?.startsWith('country'));
        const featureCountryCode = countryContext?.short_code?.toUpperCase();

        return new Place({
          id: feature.id,
          name: feature.text || feature.place_name,
          address: feature.place_name,
          latitude: lat,
          longitude: lng,
          category: feature.properties?.category || feature.place_type?.[0] || 'place',
          types: feature.place_type || [],
          distance,
          providerName: 'mapbox',
          rawData: {
            ...feature,
            countryCode: featureCountryCode,
          },
        });
      });

      // Filter by radius if provided
      let filteredPlaces = places;
      if (latitude && longitude) {
        filteredPlaces = places.filter(place => 
          place.distance !== null && place.distance <= radius
        );
      }

      // Sort by relevance and distance
      filteredPlaces.sort((a, b) => {
        const relevanceA = a.rawData.relevance || 0;
        const relevanceB = b.rawData.relevance || 0;
        
        // Combine relevance (30%) and distance (70%)
        const scoreA = (relevanceA * 0.3) + ((radius - (a.distance || 0)) / radius * 0.7);
        const scoreB = (relevanceB * 0.3) + ((radius - (b.distance || 0)) / radius * 0.7);
        
        return scoreB - scoreA;
      });

      return filteredPlaces.slice(0, 5);
    } catch (error) {
      console.error('[Mapbox] Search failed:', error);
      throw error;
    }
  }

  /**
   * Get place details (Mapbox doesn't have a separate details API)
   * Returns basic information from search
   */
  async getPlaceDetails(placeId, options = {}) {
    // For Mapbox, we don't have a separate details API
    // If we have the feature data cached, return it
    // Otherwise, return minimal details
    
    console.log('[Mapbox] Place details not fully supported, returning minimal info');
    
    return new PlaceDetails({
      id: placeId,
      name: 'Place',
      address: '',
      latitude: null,
      longitude: null,
      category: 'place',
      types: [],
      providerName: 'mapbox',
      rawData: {},
    });
  }

  /**
   * Nearby search not supported by Mapbox Geocoding API
   * Could potentially use search with proximity, but Google is better for this
   */
  async searchNearby(options = {}) {
    console.warn('[Mapbox] Nearby search not supported, use text search instead');
    return [];
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

