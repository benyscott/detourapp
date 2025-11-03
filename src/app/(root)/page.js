'use client';

import Link from 'next/link';
import Compass from "@/components/Compass";
import DistanceInfo from "@/components/DistanceInfo";
import DestinationInfo from "@/components/DestinationInfo";
import PlaceSearch from "@/components/PlaceSearch";
import Recommendations from "@/components/Recommendations";
import useNavigation from "@/hooks/useNavigation";

export default function CompassPage() {
    // Automatically calculate distance and angle when location or destination changes
    useNavigation();

    return (
        <div style={{ height: '100vh', position: 'relative' }}>
            {/* Settings button */}
            <Link
                href="/settings"
                style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 1000,
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                </svg>
            </Link>

            {/* Top bar */}
            <div className="top-bar">
                <DestinationInfo />
                <DistanceInfo />
            </div>

            {/* Center: Compass */}
            <Compass />

            {/* Recommendations */}
            <Recommendations />

            {/* Bottom bar */}
            <PlaceSearch />
        </div>
    );
}
