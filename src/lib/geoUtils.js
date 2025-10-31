/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // radius of Earth in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceInMeters) {
    if (distanceInMeters < 500) {
        // From 0m to 500m, show distance in meters, in steps of 5m
        return `${Math.round(distanceInMeters / 5) * 5} m away`;
    } else if (distanceInMeters < 1000) {
        // From 500m up to 1km, show distance in meters, in steps of 10m
        return `${Math.round(distanceInMeters / 10) * 10} m away`;
    } else if (distanceInMeters < 2000) {
        // From 1km to 2km, show distance in meters, in steps of 100m
        return `${Math.round(distanceInMeters / 100) * 100} m away`;
    } else {
        // From 2km upwards, show distance in km
        return `${(distanceInMeters / 1000).toFixed(0)} km away`;
    }
}

/**
 * Calculate the bearing angle between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing angle in degrees
 */
export function calculateAngle(lat1, lon1, lat2, lon2) {
    const deltaLatitude = lat2 - lat1;
    const deltaLongitude = lon2 - lon1;

    // Calculate the angle in degrees
    return Math.atan2(deltaLongitude, deltaLatitude) * 180 / Math.PI;
}

