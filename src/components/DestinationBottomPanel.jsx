'use client';

import { useEffect, useState } from 'react';
import { Star, StarHalf, X } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const StarRatingRow = ({ rating, className }) => {
    const r = Math.min(Math.max(Number(rating), 0), 5);
    const cells = [];

    for (let i = 1; i <= 5; i += 1) {
        const diff = r - i + 1;
        if (diff >= 1) {
            cells.push(
                <Star key={i} className={cn('size-3.5 shrink-0 fill-amber-400 text-amber-400')} aria-hidden />
            );
        } else if (diff >= 0.35) {
            cells.push(
                <StarHalf key={i} className={cn('size-3.5 shrink-0 fill-amber-400 text-amber-400')} aria-hidden />
            );
        } else {
            cells.push(
                <Star key={i} className="size-3.5 shrink-0 fill-none stroke-muted-foreground text-muted-foreground" aria-hidden />
            );
        }
    }

    return (
        <span className={cn('inline-flex items-center gap-0', className)} role="img" aria-label={`${r.toFixed(1)} out of 5 stars`}>
            {cells}
        </span>
    );
};

export default function DestinationBottomPanel() {
    const { destination, clearDestination } = usePlaceStore();

    const [details, setDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [isFavourited, setIsFavourited] = useState(false);
    const [isFavLoading, setIsFavLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    useEffect(() => {
        if (!destination?.id) {
            setDetails(null);
            setDetailsError(null);
            setIsLoadingDetails(false);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setIsLoadingDetails(true);
            setDetailsError(null);
            setDetails(null);

            try {
                const params = new URLSearchParams({ placeId: destination.id });
                const response = await fetch(`/api/place-details?${params.toString()}`);
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.error || 'Details unavailable');
                }

                if (!cancelled) {
                    setDetails(payload.result ?? null);
                }
            } catch (err) {
                if (!cancelled) {
                    setDetailsError(err.message || 'Details unavailable');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingDetails(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [destination?.id]);

    useEffect(() => {
        if (!destination?.id || !destination?.provider) {
            setIsFavourited(false);
            setSaveMessage(null);
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

    const openNow = details?.openingHours?.open_now;
    let statusEl = null;
    if (openNow === true) {
        statusEl = (
            <span className="whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                Open
            </span>
        );
    } else if (openNow === false) {
        statusEl = (
            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                Closed
            </span>
        );
    }

    const hasRatingSummary = details?.rating != null;
    const reviewCount =
        details?.userRatingsTotal != null
            ? typeof details.userRatingsTotal === 'number'
                ? details.userRatingsTotal.toLocaleString()
                : String(details.userRatingsTotal)
            : null;

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
            className="bg-card/95 w-full max-w-md rounded-2xl border px-4 py-4 shadow-lg backdrop-blur-md"
            aria-label="Selected destination"
        >
            <div className="flex w-full items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="m-0 min-w-0 max-w-[min(100%,16rem)] shrink truncate text-left text-lg leading-tight font-semibold text-foreground md:max-w-none">
                            {destination.name}
                        </h3>
                        {statusEl ? <span className="shrink-0">{statusEl}</span> : null}
                    </div>

                    {hasRatingSummary && (
                        <div
                            className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm tabular-nums"
                            aria-label={
                                reviewCount != null
                                    ? `${Number(details.rating).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} stars, ${reviewCount} reviews`
                                    : `${Number(details.rating).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} stars`
                            }
                        >
                            <span className="text-foreground font-medium" aria-hidden>
                                {Number(details.rating).toLocaleString(undefined, {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                })}
                            </span>
                            <StarRatingRow rating={details.rating} />
                            <span aria-hidden>({reviewCount != null ? reviewCount : '—'})</span>
                        </div>
                    )}

                    {isLoadingDetails && (
                        <p className="text-muted-foreground text-xs">Loading details…</p>
                    )}
                    {detailsError && !isLoadingDetails && (
                        <p className="text-destructive text-xs">{detailsError}</p>
                    )}
                    {saveMessage && (
                        <p className="text-muted-foreground text-xs">{saveMessage}</p>
                    )}
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
                            isFavourited
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-none text-muted-foreground'
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
