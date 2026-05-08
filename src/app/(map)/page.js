'use client';

import NavigationBar from '@/components/NavigationBar';
import DestinationInfo from '@/components/DestinationInfo';
import DistanceInfo from '@/components/DistanceInfo';
import PlaceSearch from '@/components/PlaceSearch';
import Recommendations from '@/components/Recommendations';

export default function HomePage() {
    return (
        <>
            <NavigationBar>
                <DestinationInfo />
                <DistanceInfo />
            </NavigationBar>
            <Recommendations />
            <PlaceSearch />
        </>
    );
}
