'use client';

import SettingsForm from '@/components/SettingsForm';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import useMapViewStore from '@/store/mapViewStore';

/** Settings slide up over the map instead of navigating away (keeps compass + location alive). */
export default function SettingsDrawer() {
    const isSettingsOpen = useMapViewStore((s) => s.isSettingsOpen);
    const setSettingsOpen = useMapViewStore((s) => s.setSettingsOpen);

    return (
        <Drawer open={isSettingsOpen} onOpenChange={setSettingsOpen}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Settings</DrawerTitle>
                    <DrawerDescription className="sr-only">Adjust how Detour searches around you.</DrawerDescription>
                </DrawerHeader>
                <div
                    className="px-4"
                    style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    <SettingsForm />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
