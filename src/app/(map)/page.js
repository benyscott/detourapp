'use client';

import NavigationBar from '@/components/NavigationBar';
import DestinationInfo from '@/components/DestinationInfo';
import DistanceInfo from '@/components/DistanceInfo';

export default function HomePage() {
    return (
        <>
            <NavigationBar>
                <DestinationInfo />
                <DistanceInfo />
            </NavigationBar>
        </>
    );
}
