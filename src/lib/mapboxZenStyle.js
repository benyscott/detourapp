const createBaseStyle = (layers) => ({
    version: 8,
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {
        composite: {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
    },
    layers,
});

export const zenStylePresets = {
    buildings: createBaseStyle([
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#FFFFFF',
            },
        },
        {
            id: 'building',
            type: 'fill',
            source: 'composite',
            'source-layer': 'building',
            minzoom: 0,
            paint: {
                'fill-color': '#f6f6f6',
            },
        },
    ]),
    streets: createBaseStyle([
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#FFFFFF',
            },
        },
        {
            id: 'road-streets',
            type: 'line',
            source: 'composite',
            'source-layer': 'road',
            paint: {
                'line-color': '#DDDDDD',
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 1,
                    14, 2,
                    17, 3,
                    20, 4,
                ],
            },
        },
    ]),
    // Only what you can walk on: streets, pedestrian streets, paths, steps. No buildings,
    // no motorways, rail, ferries or tunnels. Light grey lines on white.
    walkable: createBaseStyle([
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#FFFFFF',
            },
        },
        {
            id: 'walkable',
            type: 'line',
            source: 'composite',
            'source-layer': 'road',
            filter: [
                'all',
                ['==', ['geometry-type'], 'LineString'],
                ['!=', ['get', 'structure'], 'tunnel'],
                [
                    'match',
                    ['get', 'class'],
                    [
                        'primary', 'primary_link', 'secondary', 'secondary_link',
                        'tertiary', 'tertiary_link', 'street', 'street_limited',
                        'pedestrian', 'service', 'path', 'track',
                    ],
                    true,
                    false,
                ],
            ],
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': '#DDDDDD',
                // Wider for big streets, thin for paths; scales with zoom like real street widths
                'line-width': [
                    'interpolate',
                    ['exponential', 1.5],
                    ['zoom'],
                    14, [
                        'match', ['get', 'class'],
                        ['primary', 'primary_link', 'secondary', 'secondary_link'], 2,
                        ['tertiary', 'tertiary_link', 'street', 'street_limited', 'pedestrian'], 1.2,
                        0.6,
                    ],
                    18, [
                        'match', ['get', 'class'],
                        ['primary', 'primary_link', 'secondary', 'secondary_link'], 14,
                        ['tertiary', 'tertiary_link', 'street', 'street_limited', 'pedestrian'], 9,
                        3,
                    ],
                    22, [
                        'match', ['get', 'class'],
                        ['primary', 'primary_link', 'secondary', 'secondary_link'], 120,
                        ['tertiary', 'tertiary_link', 'street', 'street_limited', 'pedestrian'], 80,
                        28,
                    ],
                ],
            },
        },
    ]),
    'buildings-strong': createBaseStyle([
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#FFFFFF',
            },
        },
        {
            id: 'building',
            type: 'fill',
            source: 'composite',
            'source-layer': 'building',
            paint: {
                'fill-color': '#D0D0D0',
                'fill-outline-color': '#BEBEBE',
            },
        },
    ]),
};

export const resolveZenStyle = () => {
    if (process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL) {
        return process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;
    }

    const presetKey = process.env.NEXT_PUBLIC_MAPBOX_ZEN_VARIANT || 'walkable';
    return zenStylePresets[presetKey] || zenStylePresets.walkable;
};

export const mapboxZenStyle = zenStylePresets.walkable;

