'use client';

import useSettingsStore from '@/store/settingsStore';
import { formatMeters, roundDistance } from '@/lib/geoUtils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const MIN_SEARCH_RADIUS = 100;
const MAX_SEARCH_RADIUS = 5000;

/** App settings controls, shared by the Settings drawer and the /settings page. */
export default function SettingsForm() {
    const { searchRadius: storedRadius, setSearchRadius } = useSettingsStore();
    const searchRadius = Math.max(MIN_SEARCH_RADIUS, storedRadius);

    return (
        <div className="space-y-3">
            <div className="flex items-baseline justify-between">
                <Label htmlFor="search-radius">Search radius</Label>
                <span className="text-lg font-semibold tabular-nums">{formatMeters(searchRadius)}</span>
            </div>
            {/* Linear track; the value snaps to the destination-distance rounding rules */}
            <Slider
                id="search-radius"
                min={MIN_SEARCH_RADIUS}
                max={MAX_SEARCH_RADIUS}
                step={5}
                value={[searchRadius]}
                onValueChange={([value]) => setSearchRadius(roundDistance(value))}
                className="py-3"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
                <span>100 m</span>
                <span>5 km</span>
            </div>
            <p className="text-muted-foreground m-0 text-sm">
                Search only shows places within this distance of you.
            </p>
        </div>
    );
}
