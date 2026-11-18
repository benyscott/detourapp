/**
 * Arrival guide content (BAN-162).
 * Phase 1 (design): hand-written draft for Cuenca, generic placeholders elsewhere.
 * Phase 2 will generate this per city from Wikivoyage / Wikipedia / Wikidata and cache it.
 *
 * Shape: { draft, facts: [{ label }], sections: [{ id, title, body }] }
 */

const GUIDES_BY_WIKIDATA = {
    // Cuenca, Spain
    Q15098: {
        draft: true,
        facts: [
            { label: '≈ 55,000 people' },
            { label: 'Moorish roots, 8th–9th c.' },
            { label: 'UNESCO since 1996' },
            { label: 'Walkable, but steep' },
            { label: '≈ 950 m above sea level' },
        ],
        sections: [
            {
                id: 'story',
                title: 'The story',
                body:
                    'Cuenca grew on a rock ridge squeezed between two gorges, the Júcar and the Huécar. The Moors built a fortress here, Kunka, and Alfonso VIII took it in 1177. Its houses climbed to the very edge of the cliffs, and some of them, the Casas Colgadas, have been hanging over the Huécar since the 1400s. One now holds the Museum of Spanish Abstract Art. The whole walled old town is a UNESCO World Heritage Site.',
            },
            {
                id: 'people',
                title: 'The people',
                body:
                    'Conquenses live at Spanish rhythm: lunch between two and four, dinner rarely before nine, and small shops often close in the middle of the afternoon. Easter is the big moment. Semana Santa here is one of the most intense in Spain, with processions winding up the narrow streets of the old town.',
            },
            {
                id: 'around',
                title: 'Getting around',
                body:
                    'There is no metro: Cuenca is small enough to walk. The new town down below is flat; the old town is a steep climb, around twenty to thirty minutes on foot. City buses take the strain out of the climb up to the Plaza Mayor. The high-speed train station sits a few kilometres outside town, with buses into the centre, and Madrid is under an hour away.',
            },
            {
                id: 'eat',
                title: 'Eat',
                body:
                    'Morteruelo, a rich, spreadable pâté of game and liver. Ajoarriero, salt cod mashed with potato and garlic. Zarajos, lamb intestines wound around a vine stick and grilled, a local tapa you either love or avoid. Finish with alajú, a honey-and-almond sweet, and a small glass of resolí, a coffee and orange liqueur.',
            },
            {
                id: 'nearby',
                title: 'Nearby',
                body:
                    'The Ciudad Encantada, a forest of wind-carved rocks about half an hour away. The Serranía de Cuenca beyond it: the Ventano del Diablo viewpoint over the Júcar and the source of the Río Cuervo, a waterfall over mossy rock. Further south, the Roman city of Segóbriga.',
            },
        ],
    },
};

const placeholderGuide = (name) => ({
    draft: true,
    placeholder: true,
    facts: [{ label: 'Size' }, { label: 'Founded' }, { label: 'Population' }, { label: 'Walkable?' }],
    sections: [
        { id: 'story', title: 'The story', body: `How ${name} came to be, in a few lines.` },
        { id: 'people', title: 'The people', body: `Who lives in ${name}, their customs, and what's good to know before you go out.` },
        { id: 'around', title: 'Getting around', body: 'Metro, buses and how to pay, or whether your feet are all you need.' },
        { id: 'eat', title: 'Eat', body: 'What to eat here, and what the region is known for.' },
        { id: 'nearby', title: 'Nearby', body: 'Places worth the trip out of town.' },
    ],
});

export function getPlaceGuide(place) {
    if (!place) return null;
    return GUIDES_BY_WIKIDATA[place.wikidataId] ?? placeholderGuide(place.name);
}
