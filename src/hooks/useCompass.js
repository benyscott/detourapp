import { useState, useEffect, useRef } from 'react';
import usePlaceStore from '@/store/placeStore';
import useMapViewStore from '@/store/mapViewStore';

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
    const angleRef = useRef(angle);
    const destinationRef = useRef(destination);
    const setDeviceHeading = useMapViewStore((state) => state.setDeviceHeading);
    const clearDeviceOrientationIssue = useMapViewStore((state) => state.clearDeviceOrientationIssue);
    const setDeviceOrientationIssue = useMapViewStore((state) => state.setDeviceOrientationIssue);
    const isActive = Boolean(destination && angle);

    useEffect(() => {
        angleRef.current = angle;
    }, [angle]);

    useEffect(() => {
        destinationRef.current = destination;
    }, [destination]);

    useEffect(() => {
        const handler = (event) => {
            const currentDestination = destinationRef.current;
            const currentAngle = angleRef.current;

            if (!currentDestination || currentAngle == null) return;

            const rawCompassHeading = event.webkitCompassHeading;
            const hasValidWebkitCompassHeading = typeof rawCompassHeading === 'number' && rawCompassHeading >= 0;
            const deviceHeading = hasValidWebkitCompassHeading
                ? rawCompassHeading
                : (typeof event.alpha === 'number' ? Math.abs(event.alpha - 360) : null);

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
            setNeedleRotation(rotation);
        };

        orientationHandlerRef.current = handler;

        const checkPermissionStatus = () => {
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
    }, [setDeviceHeading]);

    const attachListenersFromHandler = () => {
        const handler = orientationHandlerRef.current;
        if (!handler) {
            return false;
        }
        if (isIOS) {
            window.addEventListener('deviceorientation', handler, true);
        } else {
            window.addEventListener('deviceorientationabsolute', handler, true);
            window.addEventListener('deviceorientation', handler, true);
        }
        currentHandlerRef.current = handler;
        orientationAcceptedRef.current = true;
        return true;
    };

    const requestPermission = async () => {
        if (orientationAcceptedRef.current) return true;

        if (
            typeof DeviceOrientationEvent === 'undefined' ||
            typeof DeviceOrientationEvent.requestPermission !== 'function'
        ) {
            return false;
        }

        try {
            const response = await DeviceOrientationEvent.requestPermission();
            if (response === 'granted') {
                if (attachListenersFromHandler()) {
                    clearDeviceOrientationIssue();
                    setNeedsPermission(false);
                    return true;
                }
                console.warn('[Compass] Orientation handler not available yet');
                setDeviceOrientationIssue('unsupported');
                setNeedsPermission(false);
                return false;
            }
            console.warn('[Compass] Orientation permission denied:', response);
            setDeviceOrientationIssue('denied');
            setNeedsPermission(false);
            return false;
        } catch (error) {
            console.error('[Compass] Orientation not supported:', error);
            setDeviceOrientationIssue('unsupported');
            setNeedsPermission(false);
            return false;
        }
    };

    const dismissPermissionPrompt = () => {
        setNeedsPermission(false);
    };

    return { needleRotation, isActive, requestPermission, needsPermission, dismissPermissionPrompt };
}
