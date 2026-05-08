/**
 * Default zen style used when NEXT_PUBLIC_MAPBOX_STYLE_URL is not configured.
 * You can swap this for a Mapbox Studio style URL via env without code changes.
 */
export const mapboxZenStyle = {
    version: 8,
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {
        composite: {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
        },
    },
    layers: [
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
                'fill-color': '#EEEEEE',
            },
        },
    ],
};

