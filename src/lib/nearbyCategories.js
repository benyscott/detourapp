import { Beer, Coffee, Croissant, Landmark, Pill, ShoppingCart, Trees, Utensils } from 'lucide-react';

/**
 * Quick categories under the search bar (à la Google Maps chips).
 * `type` is a Google Places (legacy) place type for Nearby Search.
 */
export const NEARBY_CATEGORIES = [
    { id: 'coffee', label: 'Coffee', type: 'cafe', icon: Coffee },
    { id: 'restaurant', label: 'Restaurants', type: 'restaurant', icon: Utensils },
    { id: 'bar', label: 'Bars', type: 'bar', icon: Beer },
    { id: 'bakery', label: 'Bakeries', type: 'bakery', icon: Croissant },
    { id: 'groceries', label: 'Groceries', type: 'supermarket', icon: ShoppingCart },
    { id: 'museum', label: 'Museums', type: 'museum', icon: Landmark },
    { id: 'park', label: 'Parks', type: 'park', icon: Trees },
    { id: 'pharmacy', label: 'Pharmacies', type: 'pharmacy', icon: Pill },
];

export const getNearbyCategory = (id) => NEARBY_CATEGORIES.find((category) => category.id === id) ?? null;
