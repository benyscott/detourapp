'use client';

import { useState, useEffect } from 'react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';

const RECOMMENDATION_TYPES = [
    { value: 'restaurant', label: '🍽️ Restaurants', emoji: '🍽️' },
    { value: 'cafe', label: '☕ Cafes', emoji: '☕' },
    { value: 'bar', label: '🍺 Bars', emoji: '🍺' },
    { value: 'museum', label: '🏛️ Museums', emoji: '🏛️' },
    { value: 'park', label: '🌳 Parks', emoji: '🌳' },
    { value: 'store', label: '🛍️ Shops', emoji: '🛍️' },
];

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const { currentLocation, setDestination, destination } = usePlaceStore();
    const { searchRadius } = useSettingsStore();

    // Hide recommendations when destination is set
    if (destination) {
        return null;
    }

    const handleTypeSelect = async (type) => {
        if (!currentLocation) {
            console.warn('[Recommendations] No location available');
            return;
        }

        setSelectedType(type);
        setIsLoading(true);

        try {
            console.log('[Recommendations] Fetching', type, 'near location');

            const params = new URLSearchParams({
                lat: currentLocation.latitude.toString(),
                lng: currentLocation.longitude.toString(),
                radius: searchRadius.toString(),
                type: type,
            });

            const response = await fetch(`/api/nearby?${params.toString()}`);
            if (!response.ok) throw new Error('Recommendations failed');

            const data = await response.json();
            const results = data.results || [];
            console.log('[Recommendations] Found', results.length, type);
            setRecommendations(results);
        } catch (error) {
            console.error('[Recommendations] Error:', error);
            setRecommendations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlace = (place) => {
        console.log('[Recommendations] Place selected:', place.name);
        setDestination({
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
        });
        setRecommendations([]);
        setSelectedType(null);
    };

    const handleClose = () => {
        setRecommendations([]);
        setSelectedType(null);
    };

    if (!currentLocation) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: 0,
            right: 0,
            padding: '0 1rem',
            zIndex: 100,
        }}>
            {/* Type selector */}
            {!selectedType && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    padding: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1rem',
                }}>
                    {RECOMMENDATION_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => handleTypeSelect(type.value)}
                            style={{
                                flex: '0 0 auto',
                                padding: '0.75rem 1rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {type.emoji} {type.label.split(' ')[1]}
                        </button>
                    ))}
                </div>
            )}

            {/* Results */}
            {selectedType && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                    }}>
                        <h3 style={{ color: 'white', margin: 0 }}>
                            {RECOMMENDATION_TYPES.find(t => t.value === selectedType)?.label}
                        </h3>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0',
                                width: '2rem',
                                height: '2rem',
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                            Loading...
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                            No {selectedType}s found nearby
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {recommendations.map((place) => (
                                <div
                                    key={place.id}
                                    onClick={() => handleSelectPlace(place)}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    <div style={{ color: 'white', fontWeight: '500' }}>
                                        {place.name}
                                    </div>
                                    {place.place_name && place.place_name !== place.name && (
                                        <div style={{ color: '#999', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                            {place.place_name}
                                        </div>
                                    )}
                                    {place.distance && (
                                        <div style={{ color: '#007AFF', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            {(place.distance / 1000).toFixed(1)} km away
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

