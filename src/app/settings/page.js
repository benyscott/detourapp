'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSettingsStore from '@/store/settingsStore';

export default function SettingsPage() {
    const { searchRadius, setSearchRadius } = useSettingsStore();
    const [tempRadius, setTempRadius] = useState(searchRadius);

    const handleRadiusChange = (e) => {
        const newRadius = parseInt(e.target.value);
        setTempRadius(newRadius);
        setSearchRadius(newRadius);
    };

    const radiusKm = (tempRadius / 1000).toFixed(1);

    return (
        <div style={{
            padding: '2rem',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/"
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        fontSize: '1.5rem',
                    }}
                >
                    ← Back
                </Link>
                <h1 style={{
                    fontSize: '2rem',
                    marginTop: '1rem',
                    fontFamily: 'var(--font-playfair-display)',
                }}>
                    Settings
                </h1>
            </div>

            {/* Settings Content */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2rem',
                borderRadius: '1rem',
                maxWidth: '600px',
            }}>
                {/* Search Radius Setting */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                Search Radius
                            </span>
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#007AFF',
                            }}>
                                {radiusKm} km
                            </span>
                        </div>

                        <input
                            type="range"
                            min="1000"
                            max="20000"
                            step="500"
                            value={tempRadius}
                            onChange={handleRadiusChange}
                            style={{
                                width: '100%',
                                height: '8px',
                                borderRadius: '5px',
                                background: 'linear-gradient(to right, #007AFF 0%, #007AFF ' + ((tempRadius - 1000) / 190) + '%, #ddd ' + ((tempRadius - 1000) / 190) + '%, #ddd 100%)',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        />

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.875rem',
                            color: '#999',
                        }}>
                            <span>1 km</span>
                            <span>20 km</span>
                        </div>
                    </label>

                    <p style={{
                        marginTop: '1rem',
                        fontSize: '0.875rem',
                        color: '#999',
                        lineHeight: '1.5',
                    }}>
                        Limits search results to places within this radius from your current location.
                        Smaller radius = fewer results but more relevant to your immediate area.
                    </p>
                </div>

                {/* Future Settings Placeholder */}
                <div style={{
                    marginTop: '3rem',
                    padding: '1.5rem',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    color: '#999',
                }}>
                    <p>More settings coming soon...</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        • Theme preferences<br />
                        • Location provider selection<br />
                        • Units (metric/imperial)
                    </p>
                </div>
            </div>
        </div>
    );
}

