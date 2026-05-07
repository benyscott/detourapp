'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function ItineraryForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Add a title before creating the itinerary.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          isPublished,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create itinerary');
      }

      router.push(`/itineraries/${payload.itinerary.id}/edit`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create itinerary');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Create itinerary</CardTitle>
        <CardDescription>
          Give your tour a name, a short overview, and decide whether it can be shared.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="itinerary-title">Title</Label>
            <Input
              id="itinerary-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Barcelona coffee walk"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itinerary-description">Description</Label>
            <Textarea
              id="itinerary-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A gentle route through favourite stops."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="itinerary-published">Publish</Label>
              <p className="text-sm text-muted-foreground">
                Published itineraries are ready to share by URL.
              </p>
            </div>
            <Switch
              id="itinerary-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              disabled={isSubmitting}
              aria-label="Publish itinerary"
            />
          </div>

          {errorMessage && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create itinerary'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
