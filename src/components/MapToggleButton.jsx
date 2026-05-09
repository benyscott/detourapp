'use client';

import { useEffect, useRef } from 'react';
import { Map, X } from 'lucide-react';
import useMapViewStore from '@/store/mapViewStore';
import { Button } from '@/components/ui/button';

const HOLD_MS = 500;

export default function MapToggleButton() {
    const mode = useMapViewStore((state) => state.mode);
    const setMode = useMapViewStore((state) => state.setMode);
    const isZenMode = mode === 'zen';

    const holdTimerRef = useRef(null);
    const isHoldingRef = useRef(false);
    const wasLatchedAtPressRef = useRef(false);
    const gestureEndedRef = useRef(false);

    useEffect(() => {
        return () => {
            if (holdTimerRef.current !== null) {
                window.clearTimeout(holdTimerRef.current);
                holdTimerRef.current = null;
            }
        };
    }, []);

    const handlePointerDown = (event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        gestureEndedRef.current = false;
        wasLatchedAtPressRef.current = useMapViewStore.getState().mode === 'reveal';
        isHoldingRef.current = false;

        setMode('reveal');

        if (holdTimerRef.current !== null) {
            window.clearTimeout(holdTimerRef.current);
        }
        holdTimerRef.current = window.setTimeout(() => {
            holdTimerRef.current = null;
            isHoldingRef.current = true;
        }, HOLD_MS);
    };

    const handlePointerEnd = () => {
        if (gestureEndedRef.current) {
            return;
        }
        gestureEndedRef.current = true;

        if (holdTimerRef.current !== null) {
            window.clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }

        if (isHoldingRef.current) {
            setMode('zen');
        } else if (wasLatchedAtPressRef.current) {
            setMode('zen');
        }

        isHoldingRef.current = false;
    };

    return (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isZenMode ? 'Show map' : 'Hide map'}
            aria-pressed={!isZenMode}
            className="rounded-full bg-transparent text-slate-900 hover:bg-black/5 touch-manipulation select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
        >
            {isZenMode ? <Map /> : <X />}
        </Button>
    );
}
