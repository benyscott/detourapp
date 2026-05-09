import { useEffect } from 'react';
import { debugMap } from '@/lib/debugMap';
import useMapViewStore from '@/store/mapViewStore';
import usePlaceStore from '@/store/placeStore';

const MIN_ZOOM = 14;
const MAX_ZOOM = 22;
const FULL_OPACITY_ZOOM = 19;
const SNAP_THRESHOLD = 0.25;
const SNAP_DURATION_MS = 150;
const SENSITIVITY = 3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
};

const getTouchMidpoint = (touches) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
});

const calculateOpacityFromZoom = (zoom) => {
    if (zoom >= MAX_ZOOM) {
        return 0;
    }
    if (zoom <= FULL_OPACITY_ZOOM) {
        return 1;
    }
    return clamp((MAX_ZOOM - zoom) / (MAX_ZOOM - FULL_OPACITY_ZOOM), 0, 1);
};

const animateSnapBack = (mapApi) => {
    const startZoom = mapApi.getZoom();
    const startOpacity = calculateOpacityFromZoom(startZoom);
    const startTime = performance.now();

    const step = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = clamp(elapsed / SNAP_DURATION_MS, 0, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextZoom = startZoom + (MAX_ZOOM - startZoom) * easedProgress;
        const nextOpacity = startOpacity * (1 - easedProgress);

        mapApi.setZoom(nextZoom);
        mapApi.setOpacity(nextOpacity);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
};

export default function usePinchZoom(mapRef) {
    const setMode = useMapViewStore((state) => state.setMode);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        debugMap('usePinchZoom: window listeners attached');

        let isPinching = false;
        let initialDistance = 0;
        let initialZoom = MAX_ZOOM;
        let frameRequested = false;
        let pendingZoom = MAX_ZOOM;
        let currentZoom = MAX_ZOOM;
        let moveLogCounter = 0;
        let previousMidpoint = null;

        const applyFrame = () => {
            frameRequested = false;
            const mapApi = mapRef.current;
            if (!mapApi) {
                return;
            }

            mapApi.setZoom(pendingZoom);
            mapApi.setOpacity(calculateOpacityFromZoom(pendingZoom));
            currentZoom = pendingZoom;
        };

        const requestApplyFrame = () => {
            if (frameRequested) {
                return;
            }

            frameRequested = true;
            requestAnimationFrame(applyFrame);
        };

        const handleTouchStart = (event) => {
            if (event.touches.length !== 2) {
                return;
            }

            const mapApi = mapRef.current;
            if (!mapApi) {
                debugMap('pinch touchstart: map ref not ready yet (two fingers detected)');
                return;
            }

            isPinching = true;
            initialDistance = getTouchDistance(event.touches);
            previousMidpoint = getTouchMidpoint(event.touches);
            initialZoom = mapApi.getZoom();
            currentZoom = initialZoom;
            debugMap('pinch start', {
                initialZoom,
                initialDistance: initialDistance.toFixed(1),
            });
        };

        const handleTouchMove = (event) => {
            if (!isPinching || event.touches.length !== 2) {
                return;
            }

            event.preventDefault();

            const mapApi = mapRef.current;
            if (!mapApi) {
                debugMap('pinch move: map ref lost');
                return;
            }

            const currentDistance = getTouchDistance(event.touches);
            if (!currentDistance || !initialDistance) {
                return;
            }

            const scale = currentDistance / initialDistance;
            const zoomDelta = Math.log2(scale) * SENSITIVITY;
            const unclampedZoom = initialZoom + zoomDelta;
            pendingZoom = clamp(unclampedZoom, MIN_ZOOM, MAX_ZOOM);

            const nextMidpoint = getTouchMidpoint(event.touches);
            const dx = nextMidpoint.x - previousMidpoint.x;
            const dy = nextMidpoint.y - previousMidpoint.y;
            previousMidpoint = nextMidpoint;
            if (dx !== 0 || dy !== 0) {
                mapApi.panBy([-dx, -dy]);
            }

            moveLogCounter += 1;
            if (moveLogCounter % 6 === 0) {
                debugMap('pinch move', {
                    scale: scale.toFixed(3),
                    unclampedZoom: unclampedZoom.toFixed(2),
                    pendingZoom: pendingZoom.toFixed(2),
                    opacity: calculateOpacityFromZoom(pendingZoom).toFixed(2),
                });
            }
            requestApplyFrame();
        };

        const handleTouchEnd = (event) => {
            if (!isPinching) {
                return;
            }

            if (event.touches.length >= 2) {
                return;
            }

            isPinching = false;
            moveLogCounter = 0;
            previousMidpoint = null;

            const mapApi = mapRef.current;
            if (!mapApi) {
                debugMap('pinch end: map ref missing');
                return;
            }

            debugMap('pinch end', { currentZoom: currentZoom.toFixed(2) });

            if (Math.abs(currentZoom - MAX_ZOOM) < SNAP_THRESHOLD) {
                debugMap('pinch snap back to zen zoom');
                animateSnapBack(mapApi);
                setMode('zen');
                return;
            }

            setMode('reveal');

            const loc = usePlaceStore.getState().currentLocation;
            if (loc && typeof mapApi.recenterOnUser === 'function') {
                mapApi.recenterOnUser();
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [mapRef, setMode]);
}
