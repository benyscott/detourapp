// Cache country code to avoid repeated API calls
let cachedCountryCode = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Detect user's country from their IP address
 * Uses ipapi.co API (free, no auth required, more reliable than myip.com)
 */
export async function getCountryFromIP() {
  // Return cached value if still valid
  if (cachedCountryCode && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('[CountryDetection] Using cached country:', cachedCountryCode);
    return cachedCountryCode;
  }

  try {
    // Try ipapi.co first (more reliable, allows CORS)
    const response = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const countryCode = data.country_code || data.country;
    
    if (countryCode) {
      console.log('[CountryDetection] Detected country:', countryCode, '-', data.country_name);
      cachedCountryCode = countryCode;
      cacheTimestamp = Date.now();
      return countryCode;
    }
  } catch (error) {
    console.warn('[CountryDetection] ipapi.co failed:', error.message);
  }

  // Fallback to default country (Spain for your case)
  console.log('[CountryDetection] Using fallback country: ES');
  cachedCountryCode = 'ES';
  cacheTimestamp = Date.now();
  return 'ES';
}

