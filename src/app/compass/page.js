import Compass from "@/components/Compass";
import DistanceInfo from "@/components/DistanceInfo";
import PlaceSearch from "@/components/PlaceSearch";


export default function CompassPage() {
    return <div className="flex flex-col items-center gap-8">
        <DistanceInfo />
        <Compass />
        <PlaceSearch />
    </div>;
}
