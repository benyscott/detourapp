/**
 * Top-of-screen greetings when there's no destination (BAN-163), like Claude's home screen.
 * Slots use the phone's local time; meal times follow Spain for now.
 */

const SLOTS = [
    { id: 'morning', from: 5, to: 11, phrases: ['Breakfast?', 'Coffee first.', 'Morning, explorer.', 'Where to this morning?'] },
    { id: 'lateMorning', from: 11, to: 13, phrases: ['Brunch, maybe?', 'Where to?', 'Fancy a wander?'] },
    { id: 'lunch', from: 13, to: 16, phrases: ['Lunch?', 'Hungry?', 'Menú del día?'] },
    { id: 'afternoon', from: 16, to: 19, phrases: ['Afternoon wander?', 'Merienda?', 'Get a little lost.'] },
    { id: 'evening', from: 19, to: 22, phrases: ['Vermut?', 'Golden hour walk?', 'Dinner plans?'] },
    { id: 'night', from: 22, to: 2, phrases: ['One more?', 'Night walk?', 'Still out?'] }, // wraps past midnight
    { id: 'lateNight', from: 2, to: 5, phrases: ['Home time?', "Can't sleep?"] },
];

const ANYTIME = [
    'Where next?',
    'Time for a detour ➰',
    'Follow your feet.',
    'The world is your oyster.',
    'Which way today?',
    'Somewhere new?',
];

/** Extra phrases for one day + slot: { day: 0 (Sunday) – 6, slots: [...] } */
const SPECIALS = [
    { day: 0, slots: ['morning', 'lateMorning'], phrase: 'Lazy Sunday?' },
    { day: 5, slots: ['evening', 'night'], phrase: 'Friday feeling?' },
];

/** Share of greetings taken from the current time slot; the rest come from ANYTIME */
const SLOT_SHARE = 0.6;

export const FIRST_OPEN_GREETING = 'Welcome to Detour ➰';

const inSlot = (hour, { from, to }) => (from < to ? hour >= from && hour < to : hour >= from || hour < to);

export function slotFor(date) {
    const hour = date.getHours();
    return SLOTS.find((slot) => inSlot(hour, slot));
}

/** Phrases that fit this moment (time slot + any day specials) */
export function phrasesFor(date) {
    const slot = slotFor(date);
    const specials = SPECIALS.filter((s) => s.day === date.getDay() && s.slots.includes(slot.id)).map((s) => s.phrase);
    return [...slot.phrases, ...specials];
}

export function pickGreeting(date = new Date(), random = Math.random) {
    const pool = random() < SLOT_SHARE ? phrasesFor(date) : ANYTIME;
    return pool[Math.floor(random() * pool.length)];
}
