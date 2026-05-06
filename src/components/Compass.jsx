'use client';

import React, { useState } from 'react';
import styles from './Compass.module.css';
import useCompass from '@/hooks/useCompass';
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
        <div id={styles.compass}>
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
                    display: isActive ? 'block' : 'none',
                    transform: `rotate(${needleRotation.toFixed(2)}deg)`,
                }}
            >
                <div id={styles.needleCircle}></div>
            </div>
        </div>
    );
};