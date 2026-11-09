'use client';

import { useState } from 'react';
import useCompass from '@/hooks/useCompass';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Compass() {
    const { requestPermission, needsPermission, dismissPermissionPrompt } = useCompass();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequestPermission = async () => {
        console.log('[Compass] User clicked permission button');
        setIsRequesting(true);
        const granted = await requestPermission();
        setIsRequesting(false);
        if (granted) {
            console.log('[Compass] Compass activated successfully');
        }
    };

    return (
        <AlertDialog open={needsPermission}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Compass permission required</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enable device orientation access to activate the compass.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={dismissPermissionPrompt}>
                        Not now
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleRequestPermission} disabled={isRequesting}>
                        {isRequesting ? 'Requesting...' : 'Enable Compass'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
