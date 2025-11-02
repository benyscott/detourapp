'use client';

import React, { useState } from 'react';
import styles from './Compass.module.css';
import useCompass from '@/hooks/useCompass';

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
            {needsPermission && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '1rem',
                    textAlign: 'center',
                    maxWidth: '80%'
                }}>
                    <p style={{ marginBottom: '1rem' }}>
                        Enable device orientation to use the compass
                    </p>
                    <button
                        onClick={handleRequestPermission}
                        disabled={isRequesting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            backgroundColor: '#007AFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isRequesting ? 'Requesting...' : 'Enable Compass'}
                    </button>
                </div>
            )}
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