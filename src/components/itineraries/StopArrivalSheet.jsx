'use client';

import { CheckCircle2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export default function StopArrivalSheet({
  open,
  onAdvance,
  stopName,
  stopNote,
  isLastStop,
  stopNumber,
  totalStops,
}) {
  return (
    <Drawer open={open} dismissible={false}>
      <DrawerContent>
        <DrawerHeader>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Arrived · Stop {stopNumber} of {totalStops}
          </p>
          <DrawerTitle className="text-2xl">{stopName ?? 'You have arrived'}</DrawerTitle>
          {stopNote ? (
            <DrawerDescription className="whitespace-pre-line text-base text-foreground/90">
              {stopNote}
            </DrawerDescription>
          ) : (
            <DrawerDescription>
              No note from the creator. Take a look around, then continue.
            </DrawerDescription>
          )}
        </DrawerHeader>
        <DrawerFooter>
          <Button onClick={onAdvance} size="lg">
            {isLastStop ? (
              <>
                <Flag />
                Finish tour
              </>
            ) : (
              <>
                <CheckCircle2 />
                Mark done & continue
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
