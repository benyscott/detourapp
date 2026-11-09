/**
 * Opening-hours checks on Google Places (New) `regularOpeningHours.periods`.
 * Each period: { open: { day, hour, minute }, close?: { day, hour, minute } }, day 0 = Sunday,
 * in the place's local time. A single period with no `close` means open 24/7.
 */

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const toWeekMinutes = ({ day, hour = 0, minute = 0 }) => day * MINUTES_PER_DAY + hour * 60 + minute;

/**
 * @param {Array|null} periods
 * @param {number} day 0 (Sunday) – 6
 * @param {number} minutes minutes after midnight
 * @returns {boolean|null} null when the hours are unknown
 */
export function isOpenAt(periods, day, minutes) {
    if (!periods?.length) return null;
    if (periods.length === 1 && periods[0].open && !periods[0].close) return true;

    const t = day * MINUTES_PER_DAY + minutes;
    return periods.some(({ open, close }) => {
        if (!open || !close) return false;
        const start = toWeekMinutes(open);
        let end = toWeekMinutes(close);
        if (end <= start) end += MINUTES_PER_WEEK; // wraps past Saturday night
        return (t >= start && t < end) || (t + MINUTES_PER_WEEK >= start && t + MINUTES_PER_WEEK < end);
    });
}
