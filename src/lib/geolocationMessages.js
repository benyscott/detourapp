/**
 * User-visible copy for geolocation failures (matches useGeolocation error handling).
 */
export function resolveGeolocationErrorMessage() {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        const host = window.location.hostname;
        if (host !== 'localhost' && host !== '127.0.0.1') {
            return 'Location requires a secure connection (HTTPS). Open this app over HTTPS, or use localhost on your computer.';
        }
    }
    return 'Unable to get your location. Please allow location access.';
}
