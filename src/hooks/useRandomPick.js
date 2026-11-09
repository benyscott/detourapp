import { useEffect, useRef, useState } from 'react';
import { pickRandomPlace } from '@/lib/roulette';

// Delays between names while the "wheel" slows down
const SPIN_STEPS_MS = [55, 55, 60, 65, 75, 85, 100, 120, 145, 175, 215, 265, 330];

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Slot-machine random pick from a list of places: cycles through real names, slowing down,
 * then lands on one. Never repeats a place until every candidate has been shown.
 */
export default function useRandomPick() {
    const [phase, setPhase] = useState('idle'); // idle | spinning | result
    const [shownName, setShownName] = useState(null);
    const [pick, setPick] = useState(null);
    const seenIdsRef = useRef([]);
    const timersRef = useRef([]);

    const clearTimers = () => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
    };

    useEffect(() => clearTimers, []);

    const reset = () => {
        clearTimers();
        seenIdsRef.current = [];
        setPhase('idle');
        setPick(null);
        setShownName(null);
    };

    const spin = (candidates) => {
        const draw = pickRandomPlace(candidates, seenIdsRef.current);
        if (!draw) return;
        seenIdsRef.current = draw.seenIds;
        clearTimers();

        const reveal = () => {
            setShownName(draw.pick.name);
            setPick(draw.pick);
            setPhase('result');
        };

        if (candidates.length < 2 || prefersReducedMotion()) {
            reveal();
            return;
        }

        setPick(null);
        setPhase('spinning');
        let elapsed = 0;
        let previous = null;
        SPIN_STEPS_MS.forEach((delay) => {
            elapsed += delay;
            timersRef.current.push(
                window.setTimeout(() => {
                    let next;
                    do {
                        next = candidates[Math.floor(Math.random() * candidates.length)].name;
                    } while (next === previous);
                    previous = next;
                    setShownName(next);
                }, elapsed)
            );
        });
        timersRef.current.push(window.setTimeout(reveal, elapsed + 380));
    };

    return { phase, shownName, pick, spin, reset };
}
