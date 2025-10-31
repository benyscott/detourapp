import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// export const map = new mapboxgl.Map({
//     container: 'map', // container ID
//     style: 'mapbox://styles/mapbox/streets-v12', // style URL
//     center: [-74.5, 40], // starting position [lng, lat]
//     zoom: 9, // starting zoom
// });

export default function Map() {
    return (
        <>
            <h1>Hello</h1>
            <div id="map"></div>
        </>
    );
}