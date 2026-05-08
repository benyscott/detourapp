'use client';

import React, { useState } from 'react';
import styles from './Compass.module.css';
import useCompass from '@/hooks/useCompass';
import useMapViewStore from '@/store/mapViewStore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Compass() {
    const { needleRotation, isActive, requestPermission, needsPermission } = useCompass();
    const [isRequesting, setIsRequesting] = useState(false);
    const currentZoom = useMapViewStore((state) => state.currentZoom);

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const zoomProgress = clamp((currentZoom - 17) / (22 - 17), 0, 1);
    const compassScale = 0.16 + zoomProgress * (1 - 0.16);
    const showNeedle = isActive;

    const handleRequestPermission = async () => {
        console.log('[Compass] User clicked permission button');
        setIsRequesting(true);
        const granted = await requestPermission();
        setIsRequesting(false);
        if (granted) {
            console.log('[Compass] Compass activated successfully');
        }
    };

    return (
        <div
            id={styles.compass}
            style={{
                transform: `translate(-50%, -50%) scale(${compassScale})`,
                transition: 'transform 200ms linear',
            }}
        >
            <AlertDialog open={needsPermission}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Compass permission required</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enable device orientation access to activate the compass.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleRequestPermission} disabled={isRequesting}>
                            {isRequesting ? 'Requesting...' : 'Enable Compass'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div
                id={styles.needle}
                style={{
                    display: showNeedle ? 'block' : 'none',
                    transform: `rotate(${needleRotation.toFixed(2)}deg)`,
                }}
            >
                <div id={styles.needleCircle}></div>
            </div>
        </div>
    );
};