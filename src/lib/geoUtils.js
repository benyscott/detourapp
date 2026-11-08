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
 * Distance rounding rules, used for the destination distance and the radius slider:
 * 5 m steps up to 500 m, 10 m up to 1 km, 100 m up to 2 km, then whole km.
 * @param {number} distanceInMeters
 * @returns {number} rounded distance in meters
 */
export function roundDistance(distanceInMeters) {
    if (distanceInMeters < 500) return Math.round(distanceInMeters / 5) * 5;
    if (distanceInMeters < 1000) return Math.round(distanceInMeters / 10) * 10;
    if (distanceInMeters < 2000) return Math.round(distanceInMeters / 100) * 100;
    return Math.round(distanceInMeters / 1000) * 1000;
}

/** @returns {string} e.g. "345 m", "1200 m", "3 km" */
export function formatMeters(distanceInMeters) {
    const rounded = roundDistance(distanceInMeters);
    return rounded >= 2000 ? `${rounded / 1000} km` : `${rounded} m`;
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceInMeters) {
    return `${formatMeters(distanceInMeters)} away`;
}

/**
 * Initial bearing from point 1 to point 2 (clockwise from true north), 0–360°.
 * Uses the standard spherical formula (not the planar atan2(Δlon, Δlat) shortcut).
 */
export function calculateAngle(lat1, lon1, lat2, lon2) {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = (Math.atan2(y, x) * 180) / Math.PI;

    return (θ + 360) % 360;
}

