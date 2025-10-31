import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';

const isIOS = typeof window !== 'undefined' &&
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/);

/**
 * Hook to handle device orientation and calculate compass needle rotation
 * @returns {object} { needleRotation: number, isActive: boolean }
 */
export default function useCompass() {
    const [needleRotation, setNeedleRotation] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const orientationAcceptedRef = useRef(false);
    const { angle, destination } = usePlaceStore();

    useEffect(() => {
        if (!destination || !angle) {
            setIsActive(false);
            return;
        }

        setIsActive(true);

        const orientationHandler = (event) => {
            if (!destination) return;

            // iOS uses webkitCompassHeading, Android uses alpha
            const deviceHeading = event.webkitCompassHeading || Math.abs(event.alpha - 360);

            // Calculate needle angle: angle to destination minus device heading
            const rotation = angle - deviceHeading;
            setNeedleRotation(rotation);
        };

        // Request permission and set up listener based on platform
        const setupOrientationListener = async () => {
            if (orientationAcceptedRef.current) return;

            if (isIOS) {
                // iOS requires permission
                if (typeof DeviceOrientationEvent !== 'undefined' &&
                    typeof DeviceOrientationEvent.requestPermission === 'function') {
                    try {
                        const response = await DeviceOrientationEvent.requestPermission();
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', orientationHandler, true);
                            orientationAcceptedRef.current = true;
                        } else {
                            console.warn('Device orientation permission denied');
                        }
                    } catch (error) {
                        console.error('Device orientation not supported:', error);
                    }
                } else {
                    // Fallback for iOS browsers that don't require permission
                    window.addEventListener('deviceorientation', orientationHandler, true);
                    orientationAcceptedRef.current = true;
                }
            } else {
                // Android uses deviceorientationabsolute
                window.addEventListener('deviceorientationabsolute', orientationHandler, true);
                orientationAcceptedRef.current = true;
            }
        };

        setupOrientationListener();

        // Cleanup
        return () => {
            if (orientationAcceptedRef.current) {
                if (isIOS) {
                    window.removeEventListener('deviceorientation', orientationHandler, true);
                } else {
                    window.removeEventListener('deviceorientationabsolute', orientationHandler, true);
                }
            }
        };
    }, [destination, angle]);

    return { needleRotation, isActive };
}

