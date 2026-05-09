'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useMapViewStore from '@/store/mapViewStore';

const ORIENTATION_COPY = {
    denied:
        'Device orientation access was denied. Enable it in your browser or site settings for compass direction.',
    unsupported: 'Device orientation is not available on this browser or device.',
};

function GeolocationAlertBanner({ message }) {
    const [dismissed, setDismissed] = useState(false);
    if (!message || dismissed) {
        return null;
    }
    return (
        <div
            role="alert"
            className="flex w-full items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground backdrop-blur-sm"
        >
            <p className="min-w-0 flex-1">{message}</p>
            <button
                type="button"
                className="text-destructive-foreground/80 hover:text-destructive-foreground shrink-0 rounded p-1"
                aria-label="Dismiss location alert"
                onClick={() => setDismissed(true)}
            >
                <X className="size-4" />
            </button>
        </div>
    );
}

function OrientationAlertBanner({ issueKey }) {
    const [dismissed, setDismissed] = useState(false);
    const copy = ORIENTATION_COPY[issueKey];
    if (!copy || dismissed) {
        return null;
    }
    return (
        <div
            role="alert"
            className="flex w-full items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground backdrop-blur-sm"
        >
            <p className="min-w-0 flex-1">{copy}</p>
            <button
                type="button"
                className="text-destructive-foreground/80 hover:text-destructive-foreground shrink-0 rounded p-1"
                aria-label="Dismiss orientation alert"
                onClick={() => setDismissed(true)}
            >
                <X className="size-4" />
            </button>
        </div>
    );
}

export default function PermissionAlerts() {
    const geolocationError = usePlaceStore((s) => s.geolocationError);
    const deviceOrientationIssue = useMapViewStore((s) => s.deviceOrientationIssue);

    const showOrientation =
        deviceOrientationIssue != null &&
        Object.prototype.hasOwnProperty.call(ORIENTATION_COPY, deviceOrientationIssue);

    if (!geolocationError && !showOrientation) {
        return null;
    }

    return (
        <div className="flex w-full flex-col gap-2">
            {geolocationError ? (
                <GeolocationAlertBanner key={geolocationError} message={geolocationError} />
            ) : null}
            {showOrientation ? (
                <OrientationAlertBanner key={deviceOrientationIssue} issueKey={deviceOrientationIssue} />
            ) : null}
        </div>
    );
}
