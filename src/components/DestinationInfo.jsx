'use client';

import React from 'react';
import usePlaceStore from '@/store/placeStore';

export default function DestinationInfo() {
    const { destination } = usePlaceStore();

    if (!destination) {
        return null;
    }

    return (
        <h2
            id="destinationName"
            style={{
                display: 'block',
                opacity: destination ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
            }}
        >
            {destination.name}
        </h2>
    );
}
