import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';

const isIOS = typeof window !== 'undefined' &&
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/);

/**
 * Hook to handle device orientation and calculate compass needle rotation
 * @returns {object} { needleRotation: number, isActive: boolean, requestPermission: function, needsPermission: boolean }
 */
export default function useCompass() {
    const [needleRotation, setNeedleRotation] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [needsPermission, setNeedsPermission] = useState(false);
    const orientationAcceptedRef = useRef(false);
    const orientationHandlerRef = useRef(null);
    const currentHandlerRef = useRef(null); // Store the actual handler function for cleanup
    const { angle, destination } = usePlaceStore();

    // Log device detection on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('[Compass] Device detection', {
                isIOS,
                userAgent: navigator.userAgent,
                hasDeviceOrientationEvent: typeof DeviceOrientationEvent !== 'undefined',
                hasRequestPermission: typeof DeviceOrientationEvent?.requestPermission === 'function'
            });
        }
    }, []);

    useEffect(() => {
        if (!destination || !angle) {
            setIsActive(false);
            return;
        }

        console.log('[Compass] Activating compass', { destination: destination.name, angle });
        setIsActive(true);

        // Create a stable handler function that reads from refs
        const handler = (event) => {
            const currentDestination = destination;
            const currentAngle = angle;

            if (!currentDestination) return;

            // iOS uses webkitCompassHeading, Android uses alpha
            const deviceHeading = event.webkitCompassHeading !== undefined
                ? event.webkitCompassHeading
                : (event.alpha !== undefined ? Math.abs(event.alpha - 360) : null);

            if (deviceHeading === null || deviceHeading === undefined) {
                console.warn('[Compass] No device heading available', {
                    webkitCompassHeading: event.webkitCompassHeading,
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma
                });
                return;
            }

            // Calculate needle angle: angle to destination minus device heading
            const rotation = currentAngle - deviceHeading;
            console.log('[Compass] Orientation update', {
                deviceHeading: deviceHeading.toFixed(1) + '°',
                bearingAngle: currentAngle.toFixed(1) + '°',
                rotation: rotation.toFixed(1) + '°'
            });
            setNeedleRotation(rotation);
        };

        // Store handler reference for cleanup
        orientationHandlerRef.current = handler;
        currentHandlerRef.current = handler;

        // Check if permission is already granted or not needed
        const checkPermissionStatus = () => {
            if (orientationAcceptedRef.current) {
                // Permission already granted, but handler might have changed - re-setup listener
                console.log('[Compass] Permission already granted, re-setting up listener');
                // Remove old listener if it exists (use stored handler reference)
                const oldHandler = currentHandlerRef.current;
                if (oldHandler) {
                    window.removeEventListener('deviceorientation', oldHandler, true);
                    window.removeEventListener('deviceorientationabsolute', oldHandler, true);
                }
                // Add listener with new handler
                if (isIOS) {
                    window.addEventListener('deviceorientation', handler, true);
                    console.log('[Compass] Orientation listener re-added (iOS)');
                } else {
                    window.addEventListener('deviceorientationabsolute', handler, true);
                    window.addEventListener('deviceorientation', handler, true);
                    console.log('[Compass] Orientation listener re-added (Android)');
                }
                currentHandlerRef.current = handler;
                return;
            }

            if (isIOS) {
                // iOS requires permission
                if (typeof DeviceOrientationEvent !== 'undefined' &&
                    typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // Check if we need to request permission
                    console.log('[Compass] iOS device - permission required');
                    setNeedsPermission(true);
                } else {
                    // Fallback for iOS browsers that don't require permission
                    console.log('[Compass] Setting up orientation listener (iOS fallback)');
                    window.addEventListener('deviceorientation', handler, true);
                    orientationAcceptedRef.current = true;
                    currentHandlerRef.current = handler;
                    console.log('[Compass] Orientation listener added (iOS fallback)');
                }
            } else {
                // Android uses deviceorientationabsolute
                console.log('[Compass] Setting up orientation listener (Android)');
                // Try both events for Android compatibility
                if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
                    // Some Android browsers also need permission
                    console.log('[Compass] Android device requires permission');
                    setNeedsPermission(true);
                } else {
                    window.addEventListener('deviceorientationabsolute', handler, true);
                    // Fallback to regular deviceorientation if absolute isn't available
                    window.addEventListener('deviceorientation', handler, true);
                    orientationAcceptedRef.current = true;
                    currentHandlerRef.current = handler;
                    console.log('[Compass] Orientation listener added (Android)');
                }
            }
        };

        checkPermissionStatus();

        // Cleanup
        return () => {
            if (orientationAcceptedRef.current && currentHandlerRef.current) {
                const handlerToRemove = currentHandlerRef.current;
                if (isIOS) {
                    window.removeEventListener('deviceorientation', handlerToRemove, true);
                } else {
                    window.removeEventListener('deviceorientationabsolute', handlerToRemove, true);
                    window.removeEventListener('deviceorientation', handlerToRemove, true);
                }
            }
        };
    }, [destination, angle]);

    // Function to request permission (must be called from user gesture)
    const requestPermission = async () => {
        if (orientationAcceptedRef.current) return true;

        if (isIOS) {
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    console.log('[Compass] Requesting orientation permission...');
                    const response = await DeviceOrientationEvent.requestPermission();
                    console.log('[Compass] Permission response:', response);
                    if (response === 'granted') {
                        console.log('[Compass] Orientation permission granted - setting up listener');
                        if (orientationHandlerRef.current) {
                            window.addEventListener('deviceorientation', orientationHandlerRef.current, true);
                            currentHandlerRef.current = orientationHandlerRef.current;
                            console.log('[Compass] Orientation listener added');
                        } else {
                            console.warn('[Compass] Orientation handler not available yet');
                        }
                        orientationAcceptedRef.current = true;
                        setNeedsPermission(false);
                        return true;
                    } else {
                        console.warn('[Compass] Orientation permission denied:', response);
                        return false;
                    }
                } catch (error) {
                    console.error('[Compass] Orientation not supported:', error);
                    return false;
                }
            }
        }
        return false;
    };

    return { needleRotation, isActive, requestPermission, needsPermission };
}