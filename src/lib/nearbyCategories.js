import { Beer, Coffee, Croissant, Landmark, Pill, ShoppingCart, Trees, Utensils } from 'lucide-react';

/**
 * Quick categories under the search bar (à la Google Maps chips).
 * `type` is a Google Places (legacy) place type for Nearby Search.
 * `openNow: false` for places Google rarely has hours for (it would drop them all).
 */
export const NEARBY_CATEGORIES = [
    { id: 'coffee', label: 'Coffee', type: 'cafe', icon: Coffee, openNow: true },
    { id: 'restaurant', label: 'Restaurants', type: 'restaurant', icon: Utensils, openNow: true },
    { id: 'bar', label: 'Bars', type: 'bar', icon: Beer, openNow: true },
    { id: 'bakery', label: 'Bakeries', type: 'bakery', icon: Croissant, openNow: true },
    { id: 'groceries', label: 'Groceries', type: 'supermarket', icon: ShoppingCart, openNow: true },
    { id: 'museum', label: 'Museums', type: 'museum', icon: Landmark, openNow: true },
    { id: 'park', label: 'Parks', type: 'park', icon: Trees, openNow: false },
    { id: 'pharmacy', label: 'Pharmacies', type: 'pharmacy', icon: Pill, openNow: true },
];

export const getNearbyCategory = (id) => NEARBY_CATEGORIES.find((category) => category.id === id) ?? null;
