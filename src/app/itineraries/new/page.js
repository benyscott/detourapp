import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ItineraryForm from '@/components/itineraries/ItineraryForm';
import { Button } from '@/components/ui/button';

export default function NewItineraryPage() {
  return (
    <main className="dark fixed inset-0 overflow-y-auto bg-background px-6 py-8 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/itineraries">
            <ArrowLeft />
            Itineraries
          </Link>
        </Button>

        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Tour builder
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Start a new itinerary</h1>
          <p className="text-sm text-muted-foreground">
            Create the overview first, then add ordered places as stops.
          </p>
        </header>

        <ItineraryForm />
      </div>
    </main>
  );
}
