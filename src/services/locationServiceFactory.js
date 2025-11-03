import { GooglePlacesProvider } from './providers/googlePlacesProvider';
import { MapboxProvider } from './providers/mapboxProvider';

/**
 * Available location service providers
 */
const PROVIDERS = {
  google: GooglePlacesProvider,
  mapbox: MapboxProvider,
  // osm: OSMProvider, // Add later when implemented
};

/**
 * Get the configured location service provider
 * Provider can be set via environment variable: NEXT_PUBLIC_LOCATION_PROVIDER
 * Defaults to 'google'
 * 
 * @returns {LocationProvider} Configured provider instance
 */
export function getLocationService() {
  const providerName = process.env.NEXT_PUBLIC_LOCATION_PROVIDER || 'google';
  
  console.log('[LocationService] Using provider:', providerName);
  
  const ProviderClass = PROVIDERS[providerName];
  
  if (!ProviderClass) {
    console.error(`[LocationService] Unknown provider: ${providerName}, falling back to google`);
    return new GooglePlacesProvider();
  }
  
  return new ProviderClass();
}

/**
 * Get a specific provider by name
 * Useful for testing or comparing providers
 * 
 * @param {string} providerName - Provider name ('google', 'mapbox', 'osm')
 * @returns {LocationProvider} Provider instance
 */
export function getProvider(providerName) {
  const ProviderClass = PROVIDERS[providerName];
  
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  
  return new ProviderClass();
}

/**
 * Get list of available providers
 * @returns {string[]} Array of provider names
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

