'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import usePlaceStore from '@/store/placeStore';
import useMapViewStore from '@/store/mapViewStore';
import { resolveZenStyle } from '@/lib/mapboxZenStyle';
import { debugMap } from '@/lib/debugMap';

const ROUTE_LAYER_PREFIX = 'route-layer-';
const ROUTE_SOURCE_PREFIX = 'route-source-';
const REVEAL_ZOOM = 17;
const ZEN_ZOOM = 22;
const MODE_TWEEN_MS = 300;

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
    const currentLocation = usePlaceStore((state) => state.currentLocation);
    const mode = useMapViewStore((state) => state.mode);
    const deviceHeading = useMapViewStore((state) => state.deviceHeading);

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
            interactive: false,
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

        if (mode !== 'zen') {
            return;
        }

        map.jumpTo({
            center: [currentLocation.longitude, currentLocation.latitude],
        });
    }, [currentLocation, mode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || deviceHeading == null) {
            return;
        }

        map.setBearing(deviceHeading);
    }, [deviceHeading]);

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
                            'line-color': '#333333',
                            'line-width': isRecommended ? 2 : 1,
                            'line-opacity': isRecommended ? 0.8 : 0.25,
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

        const targetZoom = mode === 'reveal' ? REVEAL_ZOOM : ZEN_ZOOM;
        const targetOpacity = mode === 'reveal' ? 1 : 0;

        map.easeTo({
            zoom: targetZoom,
            duration: MODE_TWEEN_MS,
            essential: true,
        });
        animateOpacityTo(targetOpacity, MODE_TWEEN_MS);
    }, [animateOpacityTo, mode]);

    useImperativeHandle(ref, () => ({
        setCenter: (latitude, longitude) => {
            if (!mapRef.current) {
                return;
            }

            mapRef.current.jumpTo({
                center: [longitude, latitude],
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
        animateToMode: (nextMode) => {
            const map = mapRef.current;
            if (!map) {
                return;
            }

            const targetZoom = nextMode === 'reveal' ? REVEAL_ZOOM : ZEN_ZOOM;
            const targetOpacity = nextMode === 'reveal' ? 1 : 0;
            map.easeTo({
                zoom: targetZoom,
                duration: MODE_TWEEN_MS,
                essential: true,
            });
            animateOpacityTo(targetOpacity, MODE_TWEEN_MS);
        },
    }), [animateOpacityTo, setOpacityValue]);

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                opacity,
                pointerEvents: 'none',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
});

export default MapboxMap;
