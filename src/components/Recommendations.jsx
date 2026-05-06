'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
        <div className="fixed right-0 bottom-20 left-0 z-[90] px-4">
            {/* Type selector */}
            {!selectedType && (
                <ScrollArea className="w-full rounded-2xl border bg-card/80 p-2 backdrop-blur-md">
                    <div className="flex w-max gap-2">
                        {RECOMMENDATION_TYPES.map((type) => (
                            <Button
                                key={type.value}
                                variant="secondary"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => handleTypeSelect(type.value)}
                            >
                                {type.emoji} {type.label.split(' ')[1]}
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}

            {/* Results */}
            {selectedType && (
                <Card className="bg-card/90 backdrop-blur-lg">
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">
                            {RECOMMENDATION_TYPES.find((type) => type.value === selectedType)?.label}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleClose}
                            aria-label="Close recommendations"
                        >
                            <X />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
                        ) : recommendations.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No {selectedType}s found nearby
                            </p>
                        ) : (
                            <ScrollArea className="max-h-[50vh] pr-2">
                                <div className="space-y-2">
                                    {recommendations.map((place) => (
                                        <Button
                                            key={place.id}
                                            variant="ghost"
                                            className="h-auto w-full justify-start rounded-lg border px-3 py-3 text-left"
                                            onClick={() => handleSelectPlace(place)}
                                        >
                                            <div className="flex w-full flex-col gap-1">
                                                <span className="font-medium">{place.name}</span>
                                                {place.place_name && place.place_name !== place.name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {place.place_name}
                                                    </span>
                                                )}
                                                {place.distance && (
                                                    <span className="text-xs text-primary">
                                                        {(place.distance / 1000).toFixed(1)} km away
                                                    </span>
                                                )}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

