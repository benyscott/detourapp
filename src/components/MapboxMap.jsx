'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ChevronRight } from 'lucide-react';
import usePlaceStore from '@/store/placeStore';
import useMapViewStore from '@/store/mapViewStore';
import { resolveZenStyle } from '@/lib/mapboxZenStyle';
import { debugMap } from '@/lib/debugMap';
import compassStyles from './Compass.module.css';

const ROUTE_LAYER_PREFIX = 'route-layer-';
const ROUTE_SOURCE_PREFIX = 'route-source-';
const REVEAL_ZOOM = 17;
const ZEN_ZOOM = 22;
const MODE_TWEEN_MS = 300;
/** Subtle horizon tilt (BAN-136); keep readable ground detail. */
const MAP_PITCH = 36;
/** At REVEAL_ZOOM, ~25vw with 33vw compass (see Compass.module.css). */
const COMPASS_MIN_SCALE = 0.14;
const OFFSCREEN_INSET_PX = 16;
const OFFSCREEN_INDICATOR_SIZE_PX = 24;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const runWhenStyleReady = (map, callback) => {
    if (!map) {
        return () => { };
    }

    if (map.isStyleLoaded()) {
        callback();
        return () => { };
    }

    const handleStyleData = () => {
        if (!map.isStyleLoaded()) {
            return;
        }
        map.off('styledata', handleStyleData);
        callback();
    };

    map.on('styledata', handleStyleData);
    return () => map.off('styledata', handleStyleData);
};

const createDotElement = ({ size, color, shadow }) => {
    const markerElement = document.createElement('div');
    markerElement.style.width = `${size}px`;
    markerElement.style.height = `${size}px`;
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = color;
    markerElement.style.boxShadow = shadow;
    return markerElement;
};

const MapboxMap = forwardRef(function MapboxMap(
    { routes = [], destination = null, recommendations = [] },
    ref
) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const destinationMarkerRef = useRef(null);
    const recommendationMarkersRef = useRef(new Map());
    const modeTweenFrameRef = useRef(null);
    const opacityRef = useRef(0);
    const [opacity, setOpacity] = useState(0);
    const [userScreenPosition, setUserScreenPosition] = useState(null);
    const [offScreenIndicator, setOffScreenIndicator] = useState(null);
    const [mapRoseBearingDeg, setMapRoseBearingDeg] = useState(0);
    const headingEaseProgrammaticRef = useRef(false);
    const prevDestinationRef = useRef(undefined);
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const angle = usePlaceStore((state) => state.angle);
    const mode = useMapViewStore((state) => state.mode);
    const deviceHeading = useMapViewStore((state) => state.deviceHeading);
    const bearingFollowsHeading = useMapViewStore((state) => state.bearingFollowsHeading);
    const headingSnapToken = useMapViewStore((state) => state.headingSnapToken);
    const setBearingFollowsHeading = useMapViewStore((state) => state.setBearingFollowsHeading);
    const currentZoom = useMapViewStore((state) => state.currentZoom);

    const compassScale = useMemo(() => {
        const zoomProgress = clamp((currentZoom - REVEAL_ZOOM) / (ZEN_ZOOM - REVEAL_ZOOM), 0, 1);
        return COMPASS_MIN_SCALE + zoomProgress * (1 - COMPASS_MIN_SCALE);
    }, [currentZoom]);

    const needleRotation =
        angle != null && deviceHeading != null ? angle - deviceHeading : 0;
    const showNeedle = Boolean(destination && angle != null);

    const setOpacityValue = useCallback((value) => {
        const clamped = clamp(value, 0, 1);
        opacityRef.current = clamped;
        setOpacity(clamped);
    }, []);

    const animateOpacityTo = useCallback((targetOpacity, duration = MODE_TWEEN_MS) => {
        if (modeTweenFrameRef.current !== null) {
            cancelAnimationFrame(modeTweenFrameRef.current);
            modeTweenFrameRef.current = null;
        }

        const startOpacity = opacityRef.current;
        const startedAt = performance.now();

        const step = (timestamp) => {
            const progress = clamp((timestamp - startedAt) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextOpacity = startOpacity + (targetOpacity - startOpacity) * eased;
            setOpacityValue(nextOpacity);

            if (progress < 1) {
                modeTweenFrameRef.current = requestAnimationFrame(step);
                return;
            }

            modeTweenFrameRef.current = null;
            setOpacityValue(targetOpacity);
        };

        modeTweenFrameRef.current = requestAnimationFrame(step);
    }, [setOpacityValue]);

    const resolvedStyle = useMemo(() => {
        return resolveZenStyle();
    }, []);

    // Single Mapbox instance for the page lifetime. Recreating on every GPS tick resets zoom and breaks pinch.
    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }
        const recommendationMarkers = recommendationMarkersRef.current;

        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        mapboxgl.accessToken = token;
        if (!token) {
            console.warn('[Detour:Map] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing; map tiles will not load.');
        }

        const loc = usePlaceStore.getState().currentLocation;
        const initialCenter = loc ? [loc.longitude, loc.latitude] : [0, 0];

        debugMap('init map', {
            hasToken: Boolean(token),
            initialCenter,
            styleIsUrl: typeof resolvedStyle === 'string',
        });

        mapRef.current = new mapboxgl.Map({
            container: containerRef.current,
            style: resolvedStyle,
            center: initialCenter,
            zoom: 22,
            pitch: MAP_PITCH,
            interactive: true,
            attributionControl: false,
            dragPan: false,
            scrollZoom: false,
            boxZoom: false,
            dragRotate: false,
            keyboard: false,
            doubleClickZoom: false,
            touchZoomRotate: false,
            touchPitch: false,
        });

        const mapInstance = mapRef.current;
        const setCurrentZoom = useMapViewStore.getState().setCurrentZoom;

        const handleLoad = () => {
            debugMap('map load', {
                zoom: mapInstance.getZoom(),
                center: mapInstance.getCenter().toArray(),
            });
        };

        const handleError = (event) => {
            console.error('[Detour:Map] Mapbox error', event?.error ?? event);
        };
        const handleZoom = () => {
            setCurrentZoom(mapInstance.getZoom());
        };

        mapInstance.once('load', handleLoad);
        mapInstance.on('error', handleError);
        mapInstance.on('zoom', handleZoom);

        return () => {
            mapInstance.off('error', handleError);
            mapInstance.off('zoom', handleZoom);
            if (destinationMarkerRef.current) {
                destinationMarkerRef.current.remove();
                destinationMarkerRef.current = null;
            }

            recommendationMarkers.forEach((marker) => marker.remove());
            recommendationMarkers.clear();

            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            if (modeTweenFrameRef.current !== null) {
                cancelAnimationFrame(modeTweenFrameRef.current);
                modeTweenFrameRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; center updates use jumpTo below
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !currentLocation) {
            return;
        }

        if (mode === 'zen') {
            map.jumpTo({
                center: [currentLocation.longitude, currentLocation.latitude],
                pitch: MAP_PITCH,
            });
        }
    }, [currentLocation, mode]);

    /** Reveal vs zen: gesture handlers & heading lock resets (BAN-141). */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (mode === 'reveal') {
            try {
                map.dragRotate?.enable?.();
                map.touchZoomRotate?.enable?.();
            } catch {
                debugMap('handlers enable failed — map still usable');
            }
            return () => {
                try {
                    map.dragRotate?.disable?.();
                    map.touchZoomRotate?.disable?.();
                } catch {
                    // ignore teardown errors during hot reload
                }
            };
        }

        try {
            map.dragRotate?.disable?.();
            map.touchZoomRotate?.disable?.();
        } catch {
            // ignore
        }

        /** Zen always aligns with compass heading semantics */
        useMapViewStore.getState().setBearingFollowsHeading(true);

        return () => {};
    }, [mode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return undefined;
        }

        const syncRose = () => {
            setMapRoseBearingDeg(map.getBearing());
        };

        syncRose();

        const handleRotateStart = () => {
            if (useMapViewStore.getState().mode !== 'reveal') {
                return;
            }
            if (headingEaseProgrammaticRef.current) {
                return;
            }
            useMapViewStore.getState().setBearingFollowsHeading(false);
        };

        map.on('rotate', syncRose);
        map.on('moveend', syncRose);
        map.on('zoomend', syncRose);
        map.on('rotatestart', handleRotateStart);

        return () => {
            map.off('rotate', syncRose);
            map.off('moveend', syncRose);
            map.off('zoomend', syncRose);
            map.off('rotatestart', handleRotateStart);
        };
    }, [setBearingFollowsHeading]);

    /** Snap bearing to compass after user taps “Heading” in reveal mode */
    useEffect(() => {
        if (headingSnapToken === 0) {
            return;
        }

        const map = mapRef.current;
        const dh = useMapViewStore.getState().deviceHeading;

        if (!map || dh == null || mode !== 'reveal') {
            return;
        }

        headingEaseProgrammaticRef.current = true;
        map.easeTo({
            bearing: dh,
            pitch: MAP_PITCH,
            duration: MODE_TWEEN_MS,
            essential: true,
        });

        const settle = () => {
            headingEaseProgrammaticRef.current = false;
            map.off('moveend', settle);
        };
        map.once('moveend', settle);
    }, [headingSnapToken, mode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || deviceHeading == null) {
            return;
        }

        const follow = mode === 'zen' || bearingFollowsHeading;
        if (!follow) {
            return;
        }

        map.setBearing(deviceHeading);
    }, [deviceHeading, mode, bearingFollowsHeading]);

    /** BAN-127: exiting navigation restores zen mode so map returns to compass-default zoom. */
    useEffect(() => {
        const prev = prevDestinationRef.current;
        prevDestinationRef.current = destination;

        if (prev === undefined) {
            return;
        }

        if (prev != null && destination == null) {
            useMapViewStore.getState().setMode('zen');
        }
    }, [destination]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !currentLocation) {
            setUserScreenPosition(null);
            return;
        }

        let frameId = null;

        const updatePosition = () => {
            frameId = null;
            const point = map.project([currentLocation.longitude, currentLocation.latitude]);
            setUserScreenPosition({ x: point.x, y: point.y });
        };

        const requestUpdate = () => {
            if (frameId !== null) {
                return;
            }
            frameId = requestAnimationFrame(updatePosition);
        };

        map.on('move', requestUpdate);
        map.on('zoom', requestUpdate);
        requestUpdate();

        return () => {
            map.off('move', requestUpdate);
            map.off('zoom', requestUpdate);
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [currentLocation]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const cleanup = runWhenStyleReady(map, () => {
            routes.forEach((route, index) => {
                if (!route?.geometry) {
                    return;
                }

                const sourceId = `${ROUTE_SOURCE_PREFIX}${index}`;
                const layerId = `${ROUTE_LAYER_PREFIX}${index}`;
                const isRecommended = index === 0;
                const routeFeature = {
                    type: 'Feature',
                    geometry: route.geometry,
                    properties: {},
                };

                const existingSource = map.getSource(sourceId);
                if (existingSource && typeof existingSource.setData === 'function') {
                    existingSource.setData(routeFeature);
                } else {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: routeFeature,
                    });
                }

                if (!map.getLayer(layerId)) {
                    map.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        maxzoom: 20,
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round',
                        },
                        paint: {
                            'line-color': '#a1d2fc',
                            'line-width': isRecommended ? 8 : 4,
                            'line-opacity': isRecommended ? 0.95 : 0.4,
                        },
                    });
                }
            });

            const existingLayerIds = map.getStyle()?.layers?.map((layer) => layer.id) || [];
            existingLayerIds
                .filter((layerId) => layerId.startsWith(ROUTE_LAYER_PREFIX))
                .forEach((layerId) => {
                    const layerIndex = Number(layerId.replace(ROUTE_LAYER_PREFIX, ''));
                    if (Number.isNaN(layerIndex) || layerIndex < routes.length) {
                        return;
                    }
                    if (map.getLayer(layerId)) {
                        map.removeLayer(layerId);
                    }
                });

            const existingSourceIds = Object.keys(map.getStyle()?.sources || {});
            existingSourceIds
                .filter((sourceId) => sourceId.startsWith(ROUTE_SOURCE_PREFIX))
                .forEach((sourceId) => {
                    const sourceIndex = Number(sourceId.replace(ROUTE_SOURCE_PREFIX, ''));
                    if (Number.isNaN(sourceIndex) || sourceIndex < routes.length) {
                        return;
                    }
                    if (map.getSource(sourceId)) {
                        map.removeSource(sourceId);
                    }
                });
        });

        return cleanup;
    }, [routes]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!destination) {
            if (destinationMarkerRef.current) {
                destinationMarkerRef.current.remove();
                destinationMarkerRef.current = null;
            }
            return;
        }

        const element = createDotElement({
            size: 12,
            color: '#555555',
            shadow: '0 0 0 2px rgba(255,255,255,0.8)',
        });

        if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
            destinationMarkerRef.current = null;
        }

        destinationMarkerRef.current = new mapboxgl.Marker({ element })
            .setLngLat([destination.longitude, destination.latitude])
            .addTo(map);
    }, [destination]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const nextMarkerIds = new Set();

        recommendations.forEach((place) => {
            if (!place?.id || place.latitude === undefined || place.longitude === undefined) {
                return;
            }

            nextMarkerIds.add(place.id);

            const existingMarker = recommendationMarkersRef.current.get(place.id);
            if (existingMarker) {
                existingMarker.setLngLat([place.longitude, place.latitude]);
                return;
            }

            const element = createDotElement({
                size: 6,
                color: '#9E9E9E',
                shadow: '0 0 0 1px rgba(255,255,255,0.65)',
            });

            const marker = new mapboxgl.Marker({ element })
                .setLngLat([place.longitude, place.latitude])
                .addTo(map);

            recommendationMarkersRef.current.set(place.id, marker);
        });

        recommendationMarkersRef.current.forEach((marker, markerId) => {
            if (nextMarkerIds.has(markerId)) {
                return;
            }
            marker.remove();
            recommendationMarkersRef.current.delete(markerId);
        });
    }, [recommendations]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const setCurrentZoomStore = useMapViewStore.getState().setCurrentZoom;
        map.stop();

        const targetZoom = mode === 'reveal' ? REVEAL_ZOOM : ZEN_ZOOM;
        const targetOpacity = mode === 'reveal' ? 1 : 0;

        map.easeTo({
            zoom: targetZoom,
            pitch: MAP_PITCH,
            duration: MODE_TWEEN_MS,
            essential: true,
        });
        animateOpacityTo(targetOpacity, MODE_TWEEN_MS);

        /** Snap zoom to store after easeTo so Compass scale stays in sync on mobile interrupted tweens */
        const snapTimer = window.setTimeout(() => {
            map.stop();
            map.setZoom(targetZoom);
            setCurrentZoomStore(targetZoom);
        }, MODE_TWEEN_MS + 32);

        return () => {
            window.clearTimeout(snapTimer);
        };
    }, [animateOpacityTo, mode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !destination) {
            setOffScreenIndicator(null);
            return;
        }

        let frameId = null;

        const updateIndicator = () => {
            frameId = null;
            const container = map.getContainer();
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (!width || !height) {
                setOffScreenIndicator(null);
                return;
            }

            const point = map.project([destination.longitude, destination.latitude]);
            const inset = OFFSCREEN_INSET_PX;
            const isInside =
                point.x >= inset &&
                point.x <= width - inset &&
                point.y >= inset &&
                point.y <= height - inset;

            if (isInside) {
                setOffScreenIndicator(null);
                return;
            }

            const cx = width / 2;
            const cy = height / 2;
            const dx = point.x - cx;
            const dy = point.y - cy;

            if (dx === 0 && dy === 0) {
                setOffScreenIndicator(null);
                return;
            }

            const halfW = Math.max(width / 2 - inset, 1);
            const halfH = Math.max(height / 2 - inset, 1);
            const tX = dx === 0 ? Infinity : Math.abs(halfW / dx);
            const tY = dy === 0 ? Infinity : Math.abs(halfH / dy);
            const t = Math.min(tX, tY);

            setOffScreenIndicator({
                x: cx + dx * t,
                y: cy + dy * t,
                rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
            });
        };

        const requestUpdate = () => {
            if (frameId !== null) {
                return;
            }
            frameId = requestAnimationFrame(updateIndicator);
        };

        map.on('move', requestUpdate);
        map.on('zoom', requestUpdate);
        requestUpdate();

        return () => {
            map.off('move', requestUpdate);
            map.off('zoom', requestUpdate);
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [destination]);

    useImperativeHandle(ref, () => ({
        setCenter: (latitude, longitude) => {
            if (!mapRef.current) {
                return;
            }

            mapRef.current.jumpTo({
                center: [longitude, latitude],
                pitch: MAP_PITCH,
            });
        },
        setZoom: (zoom) => {
            if (!mapRef.current) {
                return;
            }

            mapRef.current.setZoom(clamp(zoom, 0, 22));
        },
        setOpacity: (nextOpacity) => {
            setOpacityValue(nextOpacity);
        },
        getZoom: () => {
            return mapRef.current?.getZoom() ?? 22;
        },
        getMap: () => mapRef.current,
        panBy: (offsetXY) => {
            if (!mapRef.current) {
                return;
            }

            mapRef.current.panBy(offsetXY, { duration: 0, animate: false });
        },
        recenterOnUser: () => {
            const map = mapRef.current;
            const loc = usePlaceStore.getState().currentLocation;
            if (!map || !loc) {
                return;
            }

            map.easeTo({
                center: [loc.longitude, loc.latitude],
                pitch: MAP_PITCH,
                duration: MODE_TWEEN_MS,
                essential: true,
            });
        },
        animateToMode: (nextMode) => {
            const map = mapRef.current;
            if (!map) {
                return;
            }

            const setCurrentZoomStore = useMapViewStore.getState().setCurrentZoom;
            map.stop();

            const targetZoom = nextMode === 'reveal' ? REVEAL_ZOOM : ZEN_ZOOM;
            const targetOpacity = nextMode === 'reveal' ? 1 : 0;

            map.easeTo({
                zoom: targetZoom,
                pitch: MAP_PITCH,
                duration: MODE_TWEEN_MS,
                essential: true,
            });
            animateOpacityTo(targetOpacity, MODE_TWEEN_MS);

            window.setTimeout(() => {
                map.stop();
                map.setZoom(targetZoom);
                setCurrentZoomStore(targetZoom);
            }, MODE_TWEEN_MS + 32);
        },
    }), [animateOpacityTo, setOpacityValue]);

    return (
        <>
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    opacity,
                    pointerEvents: mode === 'reveal' ? 'auto' : 'none',
                }}
            >
                <div
                    ref={containerRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: mode === 'reveal' ? 'auto' : 'none',
                    }}
                />
                {destination && offScreenIndicator ? (
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            left: offScreenIndicator.x,
                            top: offScreenIndicator.y,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                width: OFFSCREEN_INDICATOR_SIZE_PX,
                                height: OFFSCREEN_INDICATOR_SIZE_PX,
                                borderRadius: '50%',
                                backgroundColor: '#555555',
                                boxShadow: '0 0 0 2px rgba(255,255,255,0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ChevronRight
                                aria-hidden="true"
                                style={{
                                    width: 14,
                                    height: 14,
                                    color: '#FFFFFF',
                                    transform: `rotate(${offScreenIndicator.rotation}deg)`,
                                }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
            {userScreenPosition ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        left: userScreenPosition.x,
                        top: userScreenPosition.y,
                        transform: `translate(-50%, -50%) scale(${compassScale})`,
                        transition: `transform ${MODE_TWEEN_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`,
                        zIndex: 5,
                        pointerEvents: 'none',
                    }}
                >
                    <div id={compassStyles.compass}>
                        <div
                            id={compassStyles.needle}
                            style={{
                                display: showNeedle ? 'block' : 'none',
                                transform: `rotate(${needleRotation.toFixed(2)}deg)`,
                            }}
                        >
                            <div id={compassStyles.needleCircle}></div>
                        </div>
                    </div>
                </div>
            ) : null}
            {mode === 'reveal' && !bearingFollowsHeading ? (
                <div
                    className="glass-surface pointer-events-none fixed right-5 top-28 z-[8] flex size-14 flex-col items-center justify-center rounded-full transition-opacity duration-300"
                    role="status"
                    aria-live="polite"
                    aria-label="Map north indicator"
                >
                    <div
                        className="absolute inset-1 rounded-full border border-dashed border-white/40"
                        aria-hidden
                    />
                    <div
                        className="text-foreground relative text-xs font-bold tracking-tight drop-shadow-sm"
                        style={{ transform: `rotate(${-mapRoseBearingDeg}deg)` }}
                        aria-hidden
                    >
                        N
                    </div>
                </div>
            ) : null}
        </>
    );
});

export default MapboxMap;
