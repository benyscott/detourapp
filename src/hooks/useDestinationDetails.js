import { useEffect, useState } from 'react';

/**
 * Fetches Google place details for the selected destination (shared by top bar + panels).
 * @param {{ id?: string } | null} destination
 */
export default function useDestinationDetails(destination) {
    const [details, setDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    useEffect(() => {
        if (!destination?.id) {
            queueMicrotask(() => {
                setDetails(null);
                setDetailsError(null);
                setIsLoadingDetails(false);
            });
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

    return {
        details,
        isLoadingDetails,
        detailsError,
    };
}
