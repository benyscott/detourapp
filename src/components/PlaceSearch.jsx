'use client';

import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';
import useGeolocation from '@/hooks/useGeolocation';

export default function PlaceSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);

    const { destination, setDestination, clearDestination } = usePlaceStore();
    const [isTracking, setIsTracking] = useState(false);
    const { error: geoError } = useGeolocation(isTracking);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchQuery.trim()) {
            setResults([]);
            setIsSearching(false);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/places?q=${encodeURIComponent(searchQuery)}`);
                if (!response.ok) throw new Error('Search failed');

                const data = await response.json();
                setResults(data.results || []);
                setShowResults(true);
            } catch (error) {
                console.error('Error searching places:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [searchQuery]);

    const handleSelectPlace = (place) => {
        setDestination({
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
        });
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
    };

    const handleStartWay = () => {
        if (!destination) return;
        setIsTracking(true);
    };

    const handleStopWay = () => {
        setIsTracking(false);
        clearDestination();
        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Hide search input when destination is selected
    const showSearchInput = !destination;
    const showStartButton = destination && !isTracking;
    const showStopButton = destination && isTracking;

    return (
        <div className="bottom-bar">
            {showSearchInput && (
                <form
                    id="search-place"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (results.length > 0) {
                            handleSelectPlace(results[0]);
                        }
                    }}
                >
                    <input
                        ref={searchInputRef}
                        type="text"
                        id="search-input"
                        placeholder="Where shall we go?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowResults(results.length > 0)}
                        onBlur={() => {
                            // Delay hiding results to allow click on result
                            setTimeout(() => setShowResults(false), 200);
                        }}
                    />
                    {showResults && results.length > 0 && (
                        <div className="search-results">
                            {results.map((place) => (
                                <div
                                    key={place.id}
                                    className="search-result-item"
                                    onClick={() => handleSelectPlace(place)}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent onBlur
                                >
                                    <div className="result-name">{place.name}</div>
                                    {place.place_name !== place.name && (
                                        <div className="result-place">{place.place_name}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {isSearching && <div className="search-loading">Searching...</div>}
                </form>
            )}

            {showStartButton && (
                <div id="startWayButton" onClick={handleStartWay}>
                    Let's go
                </div>
            )}

            {showStopButton && (
                <div id="stopWayButton" onClick={handleStopWay}>
                    X
                </div>
            )}

            {geoError && (
                <div className="error-message">{geoError}</div>
            )}
        </div>
    );
}
