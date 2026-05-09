'use client';

import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DestinationBottomPanel() {
    const { destination, clearDestination } = usePlaceStore();

    const [isFavourited, setIsFavourited] = useState(false);
    const [isFavLoading, setIsFavLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    useEffect(() => {
        if (!destination?.id || !destination?.provider) {
            queueMicrotask(() => {
                setIsFavourited(false);
                setSaveMessage(null);
            });
            return;
        }

        let cancelled = false;
        const loadFavStatus = async () => {
            try {
                const params = new URLSearchParams({
                    provider: destination.provider,
                    externalId: destination.id,
                });
                const response = await fetch(`/api/places/save?${params.toString()}`);
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to load favourite status');
                }

                if (!cancelled) {
                    setIsFavourited(Boolean(payload.isFavourited));
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn('[DestinationBottomPanel] favourite status check failed', error);
                }
            }
        };

        loadFavStatus();
        return () => {
            cancelled = true;
        };
    }, [destination?.id, destination?.provider]);

    if (!destination) {
        return null;
    }

    const handleClearDestination = () => {
        clearDestination();
    };

    const handleToggleFavourite = async () => {
        if (!destination?.id || !destination?.provider) {
            setSaveMessage('Missing place identifier');
            return;
        }

        const wasFavourited = isFavourited;
        setIsFavLoading(true);
        setSaveMessage(null);
        setIsFavourited(!wasFavourited);

        try {
            if (wasFavourited) {
                const response = await fetch('/api/places/save', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider: destination.provider,
                        externalId: destination.id,
                    }),
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to remove from Favourites');
                }

                setSaveMessage('Removed from Favourites');
                return;
            }

            const response = await fetch('/api/places/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: destination.provider,
                    externalId: destination.id,
                    place: {
                        name: destination.name,
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                        category: destination.category ?? 'place',
                        address: destination.address ?? null,
                    },
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error || 'Failed to save place');
            }

            setSaveMessage(payload.alreadyInList ? 'Already in Favourites' : 'Saved to Favourites');
        } catch (error) {
            setIsFavourited(wasFavourited);
            setSaveMessage(error.message || 'Failed to update Favourites');
        } finally {
            setIsFavLoading(false);
        }
    };

    return (
        <section
            className="glass-surface w-full max-w-md rounded-2xl px-4 py-3"
            aria-label="Destination actions"
        >
            <div className="flex w-full items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground m-0 text-xs font-medium uppercase tracking-wide">
                        Quick actions
                    </p>
                    <h3 className="text-foreground m-0 max-w-[min(100%,18rem)] truncate text-left text-sm font-semibold md:max-w-none">
                        {destination.name}
                    </h3>
                    {saveMessage ? (
                        <p className="text-muted-foreground m-0 mt-1 text-xs">{saveMessage}</p>
                    ) : null}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full bg-muted/50 hover:bg-muted"
                    onClick={handleToggleFavourite}
                    disabled={isFavLoading}
                    aria-pressed={isFavourited}
                    aria-label={isFavourited ? 'Remove from Favourites' : 'Save to Favourites'}
                >
                    <Star
                        className={cn(
                            'size-5',
                            isFavourited ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground'
                        )}
                        aria-hidden
                    />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full bg-muted/50 hover:bg-muted"
                    onClick={handleClearDestination}
                    aria-label="Clear destination"
                >
                    <X className="size-5" aria-hidden />
                </Button>
            </div>
        </section>
    );
}
