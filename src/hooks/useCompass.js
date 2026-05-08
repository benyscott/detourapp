import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';
import useMapViewStore from '@/store/mapViewStore';
import { debugMap } from '@/lib/debugMap';

const isIOS = typeof window !== 'undefined' &&
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/);

/**
 * Hook to handle device orientation and calculate compass needle rotation
 * @returns {object} { needleRotation: number, isActive: boolean, requestPermission: function, needsPermission: boolean }
 */
export default function useCompass() {
    const [needleRotation, setNeedleRotation] = useState(0);
    const [needsPermission, setNeedsPermission] = useState(false);
    const orientationAcceptedRef = useRef(false);
    const orientationHandlerRef = useRef(null);
    const currentHandlerRef = useRef(null);
    const { angle, destination } = usePlaceStore();
    const setDeviceHeading = useMapViewStore((state) => state.setDeviceHeading);
    const isActive = Boolean(destination && angle);

    useEffect(() => {
        if (!destination || !angle) {
            return;
        }

        const handler = (event) => {
            const currentDestination = destination;
            const currentAngle = angle;

            if (!currentDestination) return;

            const deviceHeading = event.webkitCompassHeading !== undefined
                ? event.webkitCompassHeading
                : (event.alpha !== undefined ? Math.abs(event.alpha - 360) : null);

            if (deviceHeading === null || deviceHeading === undefined) {
                console.warn('[Compass] No device heading available', {
                    webkitCompassHeading: event.webkitCompassHeading,
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma,
                });
                return;
            }

            const rotation = currentAngle - deviceHeading;
            setDeviceHeading(deviceHeading);
            // debugMap('compass heading', { deviceHeading, angle: currentAngle, rotation });
            setNeedleRotation(rotation);
        };

        orientationHandlerRef.current = handler;
        currentHandlerRef.current = handler;

        const checkPermissionStatus = () => {
            if (orientationAcceptedRef.current) {
                const oldHandler = currentHandlerRef.current;
                if (oldHandler) {
                    window.removeEventListener('deviceorientation', oldHandler, true);
                    window.removeEventListener('deviceorientationabsolute', oldHandler, true);
                }
                if (isIOS) {
                    window.addEventListener('deviceorientation', handler, true);
                } else {
                    window.addEventListener('deviceorientationabsolute', handler, true);
                    window.addEventListener('deviceorientation', handler, true);
                }
                currentHandlerRef.current = handler;
                return;
            }

            if (isIOS) {
                if (typeof DeviceOrientationEvent !== 'undefined' &&
                    typeof DeviceOrientationEvent.requestPermission === 'function') {
                    setNeedsPermission(true);
                } else {
                    window.addEventListener('deviceorientation', handler, true);
                    orientationAcceptedRef.current = true;
                    currentHandlerRef.current = handler;
                }
            } else {
                if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
                    setNeedsPermission(true);
                } else {
                    window.addEventListener('deviceorientationabsolute', handler, true);
                    window.addEventListener('deviceorientation', handler, true);
                    orientationAcceptedRef.current = true;
                    currentHandlerRef.current = handler;
                }
            }
        };

        checkPermissionStatus();

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
    }, [destination, angle, setDeviceHeading]);

    const requestPermission = async () => {
        if (orientationAcceptedRef.current) return true;

        if (isIOS) {
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === 'granted') {
                        if (orientationHandlerRef.current) {
                            window.addEventListener('deviceorientation', orientationHandlerRef.current, true);
                            currentHandlerRef.current = orientationHandlerRef.current;
                        } else {
                            console.warn('[Compass] Orientation handler not available yet');
                        }
                        orientationAcceptedRef.current = true;
                        setNeedsPermission(false);
                        return true;
                    }
                    console.warn('[Compass] Orientation permission denied:', response);
                    return false;
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
