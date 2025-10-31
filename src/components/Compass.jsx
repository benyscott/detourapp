'use client';

import React from 'react';
import styles from './Compass.module.css';
import useCompass from '@/hooks/useCompass';

export default function Compass() {
    const { needleRotation, isActive } = useCompass();

    return (
        <div id={styles.compass}>
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
