/**
 * Abstract base class for location service providers
 * All providers (Google, Mapbox, OSM, etc.) must implement this interface
 */
export class LocationProvider {
  /**
   * Search for places by text query
   * @param {string} query - Search query (e.g., "Syra Coffee")
   * @param {Object} options - Search options
   * @param {number} options.latitude - User's latitude
   * @param {number} options.longitude - User's longitude
   * @param {number} options.radius - Search radius in meters
   * @param {string} options.countryCode - ISO country code (e.g., "ES")
   * @param {string} options.sessionToken - Session token for API optimization
   * @returns {Promise<Place[]>} Array of places
   */
  async searchPlaces(query, options) {
    throw new Error('searchPlaces() must be implemented by provider');
  }

  /**
   * Get detailed information about a specific place
   * @param {string} placeId - Provider-specific place ID
   * @param {Object} options - Additional options
   * @param {string} options.sessionToken - Session token for API optimization
   * @returns {Promise<PlaceDetails>} Detailed place information
   */
  async getPlaceDetails(placeId, options = {}) {
    throw new Error('getPlaceDetails() must be implemented by provider');
  }

  /**
   * Search for nearby places by type/category
   * @param {Object} options - Search options
   * @param {number} options.latitude - Center latitude
   * @param {number} options.longitude - Center longitude
   * @param {number} options.radius - Search radius in meters
   * @param {string} options.type - Place type (e.g., "restaurant", "cafe")
   * @param {string} options.countryCode - ISO country code (e.g., "ES")
   * @returns {Promise<Place[]>} Array of nearby places
   */
  async searchNearby(options) {
    throw new Error('searchNearby() must be implemented by provider');
  }
}

/**
 * Standardized Place object
 * All providers must return places in this format
 */
export class Place {
  constructor({
    id,
    name,
    address,
    latitude,
    longitude,
    category,
    types = [],
    distance = null,
    providerName,
    rawData = {},
  }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.category = category;
    this.types = types;
    this.distance = distance; // Distance in meters
    this.providerName = providerName; // 'google', 'mapbox', 'osm'
    this.rawData = rawData; // Store original data for provider-specific features
  }

  /**
   * Convert to API response format
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      place_name: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      category: this.category,
      types: this.types,
      distance: this.distance,
      provider: this.providerName,
    };
  }
}

/**
 * Detailed place information
 */
export class PlaceDetails extends Place {
  constructor({
    id,
    name,
    address,
    latitude,
    longitude,
    category,
    types = [],
    distance = null,
    providerName,
    rawData = {},
    // Extended details
    phone = null,
    website = null,
    rating = null,
    userRatingsTotal = null,
    priceLevel = null,
    openingHours = null,
    photos = [],
    reviews = [],
  }) {
    super({
      id,
      name,
      address,
      latitude,
      longitude,
      category,
      types,
      distance,
      providerName,
      rawData,
    });

    this.phone = phone;
    this.website = website;
    this.rating = rating;
    this.userRatingsTotal = userRatingsTotal;
    this.priceLevel = priceLevel;
    this.openingHours = openingHours;
    this.photos = photos;
    this.reviews = reviews;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      phone: this.phone,
      website: this.website,
      rating: this.rating,
      userRatingsTotal: this.userRatingsTotal,
      priceLevel: this.priceLevel,
      openingHours: this.openingHours,
      photos: this.photos,
      reviews: this.reviews,
    };
  }
}

