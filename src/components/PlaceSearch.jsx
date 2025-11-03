'use client';

import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';
import useSettingsStore from '@/store/settingsStore';
import useGeolocation from '@/hooks/useGeolocation';

export default function PlaceSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchInputRef = useRef(null);

    const { destination, setDestination, clearDestination, currentLocation } = usePlaceStore();
    const { searchRadius } = useSettingsStore();
    const [isTracking, setIsTracking] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(true); // Track location for search filtering
    const { error: geoError } = useGeolocation(isTracking || isSearchMode);

    // Debounced search - only triggered by query change, not location updates
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

        // Don't search for very short queries
        if (searchQuery.trim().length < 3) {
            console.log('[PlaceSearch] Query too short, waiting for more characters...');
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('[PlaceSearch] Searching for:', searchQuery, 'with radius:', searchRadius);
                
                // Build query params - use current location at time of search
                const params = new URLSearchParams({ 
                    q: searchQuery,
                    radius: searchRadius.toString(),
                });
                
                // Capture current location to avoid using stale value
                const searchLocation = currentLocation;
                if (searchLocation) {
                    params.append('lat', searchLocation.latitude.toString());
                    params.append('lng', searchLocation.longitude.toString());
                }
                
                const response = await fetch(`/api/places?${params.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Search failed');
                }

                const data = await response.json();
                const results = data.results || [];
                console.log('[PlaceSearch] Found', results.length, 'results within', searchRadius / 1000, 'km');
                setResults(results);
                setShowResults(true);
            } catch (error) {
                console.error('[PlaceSearch] Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 600); // Increased debounce to 600ms
    }, [searchQuery, searchRadius]); // Removed currentLocation from dependencies!

    const handleSelectPlace = (place) => {
        console.log('[PlaceSearch] Place selected:', place.name);
        setDestination({
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
        });
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
        setIsSearchMode(false); // Stop location tracking for search when destination is selected
    };

    const handleStartWay = () => {
        if (!destination) return;
        console.log('[PlaceSearch] Starting navigation to:', destination.name);
        setIsTracking(true);
    };

    const handleStopWay = () => {
        console.log('[PlaceSearch] Stopping navigation');
        setIsTracking(false);
        clearDestination();
        setSearchQuery('');
        setIsSearchMode(true); // Resume location tracking for search
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
