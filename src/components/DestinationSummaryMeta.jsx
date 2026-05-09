'use client';

import { Star, StarHalf } from 'lucide-react';
import useDestinationDetails from '@/hooks/useDestinationDetails';
import usePlaceStore from '@/store/placeStore';
import { cn } from '@/lib/utils';

const StarRatingRow = ({ rating, className }) => {
    const r = Math.min(Math.max(Number(rating), 0), 5);
    const cells = [];

    for (let i = 1; i <= 5; i += 1) {
        const diff = r - i + 1;
        if (diff >= 1) {
            cells.push(
                <Star key={i} className={cn('size-3 shrink-0 fill-amber-400 text-amber-400')} aria-hidden />
            );
        } else if (diff >= 0.35) {
            cells.push(
                <StarHalf key={i} className={cn('size-3 shrink-0 fill-amber-400 text-amber-400')} aria-hidden />
            );
        } else {
            cells.push(
                <Star key={i} className="size-3 shrink-0 fill-none stroke-muted-foreground text-muted-foreground" aria-hidden />
            );
        }
    }

    return (
        <span className={cn('inline-flex items-center gap-0', className)} role="img" aria-label={`${r.toFixed(1)} out of 5 stars`}>
            {cells}
        </span>
    );
};

export default function DestinationSummaryMeta() {
    const destination = usePlaceStore((s) => s.destination);
    const { details, isLoadingDetails, detailsError } = useDestinationDetails(destination);

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

    const showAnything = hasRatingSummary || statusEl || isLoadingDetails || detailsError;

    if (!showAnything) {
        return null;
    }

    return (
        <div className="flex max-w-[min(100%,20rem)] flex-col items-center gap-1.5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                {statusEl ? <span className="shrink-0">{statusEl}</span> : null}
                {hasRatingSummary ? (
                    <div
                        className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs tabular-nums"
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
                        <span aria-hidden className="text-muted-foreground">
                            ({reviewCount != null ? reviewCount : '—'})
                        </span>
                    </div>
                ) : null}
            </div>
            {isLoadingDetails ? (
                <p className="text-muted-foreground m-0 text-[11px]">Loading details…</p>
            ) : null}
            {detailsError && !isLoadingDetails ? (
                <p className="text-destructive m-0 text-[11px]">{detailsError}</p>
            ) : null}
        </div>
    );
}
