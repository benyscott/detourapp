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
            paint: {
                'fill-color': '#DCDCDC',
                'fill-outline-color': '#CFCFCF',
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

    const presetKey = process.env.NEXT_PUBLIC_MAPBOX_ZEN_VARIANT || 'buildings';
    return zenStylePresets[presetKey] || zenStylePresets.buildings;
};

export const mapboxZenStyle = zenStylePresets.buildings;

