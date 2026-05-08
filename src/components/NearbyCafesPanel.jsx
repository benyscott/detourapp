'use client';

import { useEffect, useState } from 'react';
import { Coffee, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useMapViewStore from '@/store/mapViewStore';

export default function NearbyCafesPanel() {
    const isCafesOpen = useMapViewStore((s) => s.isCafesOpen);
    const setCafesOpen = useMapViewStore((s) => s.setCafesOpen);

    const currentLocation = usePlaceStore((s) => s.currentLocation);
    const setDestination = usePlaceStore((s) => s.setDestination);
    const setRecommendations = usePlaceStore((s) => s.setRecommendations);
    const clearRecommendations = usePlaceStore((s) => s.clearRecommendations);

    const { searchRadius } = useSettingsStore();

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isCafesOpen) {
            clearRecommendations();
            setResults([]);
            setError(null);
        }
    }, [isCafesOpen, clearRecommendations]);

    useEffect(() => {
        if (!isCafesOpen || !currentLocation) {
            return;
        }

        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            setResults([]);

            try {
                const params = new URLSearchParams({
                    lat: currentLocation.latitude.toString(),
                    lng: currentLocation.longitude.toString(),
                    radius: searchRadius.toString(),
                    type: 'cafe',
                });

                const response = await fetch(`/api/nearby?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Could not load cafes nearby');
                }

                const data = await response.json();
                const list = data.results || [];

                if (!cancelled) {
                    setResults(list);
                    setRecommendations(list);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Could not load cafes');
                    clearRecommendations();
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isCafesOpen, currentLocation, searchRadius, setRecommendations, clearRecommendations]);

    const handleClose = () => {
        setCafesOpen(false);
    };

    const handleSelectPlace = (place) => {
        setDestination({
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
        });
        setCafesOpen(false);
    };

    if (!isCafesOpen) {
        return null;
    }

    return (
        <div className="w-full max-h-[min(40vh,320px)]" aria-label="Cafes nearby">
            <Card className="bg-card/95 flex max-h-[min(40vh,320px)] flex-col overflow-hidden shadow-lg backdrop-blur-md">
                <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Coffee className="size-5" aria-hidden />
                        Cafes nearby
                    </CardTitle>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleClose}
                        aria-label="Close cafes list"
                    >
                        <X />
                    </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 pt-0">
                    {!currentLocation && (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                            Waiting for your location…
                        </p>
                    )}
                    {currentLocation && isLoading && (
                        <p className="text-muted-foreground py-8 text-center text-sm">Loading cafes…</p>
                    )}
                    {currentLocation && error && !isLoading && (
                        <p className="text-destructive py-4 text-center text-sm">{error}</p>
                    )}
                    {currentLocation && !isLoading && !error && results.length === 0 && (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No cafes found in this area.
                        </p>
                    )}
                    {currentLocation && !isLoading && !error && results.length > 0 && (
                        <ScrollArea className="max-h-[min(35vh,280px)] pr-2">
                            <div className="space-y-2 pb-2">
                                {results.map((place) => (
                                    <Button
                                        key={place.id}
                                        type="button"
                                        variant="ghost"
                                        className="h-auto w-full justify-start rounded-lg border px-3 py-3 text-left"
                                        onClick={() => handleSelectPlace(place)}
                                    >
                                        <div className="flex w-full flex-col gap-1">
                                            <span className="font-medium">{place.name}</span>
                                            {place.place_name && place.place_name !== place.name && (
                                                <span className="text-muted-foreground text-xs">
                                                    {place.place_name}
                                                </span>
                                            )}
                                            {place.distance != null && (
                                                <span className="text-primary text-xs">
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
        </div>
    );
}
