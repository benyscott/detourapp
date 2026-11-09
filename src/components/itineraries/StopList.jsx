'use client';

import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const getTransformStyle = (transform) => {
  if (!transform) {
    return undefined;
  }

  return `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`;
};

function SortableStop({ itineraryId, stop, index, onNoteSaved, onRemoved }) {
  const [note, setNote] = useState(stop.notes ?? '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const handleNoteBlur = async () => {
    if ((stop.notes ?? '') === note.trim()) {
      return;
    }

    setIsSavingNote(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/stops/${stop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save note');
      }

      onNoteSaved(stop.id, payload.stop.notes);
      setMessage('Note saved');
    } catch (error) {
      setMessage(error.message || 'Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/stops/${stop.id}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to remove stop');
      }

      onRemoved(stop.id);
    } catch (error) {
      setMessage(error.message || 'Failed to remove stop');
      setIsRemoving(false);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: getTransformStyle(transform),
        transition,
      }}
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm',
        isDragging && 'relative z-10 opacity-80 shadow-lg'
      )}
    >
      <div className="flex gap-3">
        <button
          type="button"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Reorder stop ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Stop {index + 1}
              </p>
              <h3 className="truncate text-lg font-semibold">{stop.place?.name ?? 'Untitled place'}</h3>
              {stop.place?.address && (
                <p className="truncate text-sm text-muted-foreground">{stop.place.address}</p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              disabled={isRemoving}
              aria-label={`Remove ${stop.place?.name ?? 'stop'}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add an optional note for this stop"
            disabled={isSavingNote || isRemoving}
            className="min-h-20"
          />

          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
      </div>
    </li>
  );
}

export default function StopList({ itineraryId, stops, onStopsReordered, onStopUpdated, onStopRemoved }) {
  const [message, setMessage] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stops.findIndex((stop) => stop.id === active.id);
    const newIndex = stops.findIndex((stop) => stop.id === over.id);
    const reorderedStops = arrayMove(stops, oldIndex, newIndex);
    onStopsReordered(reorderedStops);
    setMessage(null);

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/stops`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stopIds: reorderedStops.map((stop) => stop.id) }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to reorder stops');
      }

      onStopsReordered(payload.itinerary.stops ?? reorderedStops);
    } catch (error) {
      onStopsReordered(stops);
      setMessage(error.message || 'Failed to reorder stops');
    }
  };

  if (stops.length === 0) {
    return (
      <section className="rounded-xl border border-dashed bg-card/50 p-6 text-center">
        <h2 className="text-lg font-semibold">No stops yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search for a place above to add the first stop.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stops</h2>
        <p className="text-sm text-muted-foreground">{stops.length} total</p>
      </div>

      {message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {stops.map((stop, index) => (
              <SortableStop
                key={stop.id}
                itineraryId={itineraryId}
                stop={stop}
                index={index}
                onNoteSaved={onStopUpdated}
                onRemoved={onStopRemoved}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </section>
  );
}
