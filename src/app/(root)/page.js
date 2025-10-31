'use client';

import Compass from "@/components/Compass";
import DistanceInfo from "@/components/DistanceInfo";
import DestinationInfo from "@/components/DestinationInfo";
import PlaceSearch from "@/components/PlaceSearch";
import useNavigation from "@/hooks/useNavigation";

export default function CompassPage() {
    // Automatically calculate distance and angle when location or destination changes
    useNavigation();

    return (
        <div style={{ height: '100vh', position: 'relative' }}>
            {/* Top bar */}
            <div className="top-bar">
                <DestinationInfo />
                <DistanceInfo />
            </div>

            {/* Center: Compass */}
            <Compass />

            {/* Bottom bar */}
            <PlaceSearch />
        </div>
    );
}
