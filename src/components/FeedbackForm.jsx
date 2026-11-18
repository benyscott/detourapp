'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import useVisitStore from '@/store/visitStore';

const KINDS = [
    { id: 'bug', label: '🐞 Bug', placeholder: 'What happened? What did you expect?' },
    { id: 'idea', label: '💡 Idea', placeholder: 'What would make Detour better?' },
    { id: 'love', label: '❤️ Love it', placeholder: 'What made you smile?' },
    { id: 'other', label: '💬 Other', placeholder: 'Tell us anything.' },
];

/** "Feedback" button that unfolds into a tiny form, stored in Supabase (BAN-165). */
export default function FeedbackForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [kind, setKind] = useState('bug');
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const placeholder = KINDS.find((k) => k.id === kind)?.placeholder;

    const reset = () => {
        setMessage('');
        setContact('');
        setStatus('idle');
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!message.trim() || status === 'sending') return;
        setStatus('sending');
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kind,
                    message,
                    contact,
                    town: useVisitStore.getState().currentPlace?.name ?? null,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setStatus('sent');
        } catch (error) {
            console.error('[Feedback] Send failed:', error);
            setStatus('error');
        }
    };

    if (!isOpen) {
        return (
            <Button variant="outline" className="w-full rounded-full" onClick={() => setIsOpen(true)}>
                Feedback
            </Button>
        );
    }

    if (status === 'sent') {
        return (
            <div className="space-y-3 text-center">
                <p className="m-0 text-sm">Thank you! Every word gets read. 🙏</p>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={reset}>
                    Send another
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of feedback">
                {KINDS.map((k) => (
                    <button
                        key={k.id}
                        type="button"
                        role="radio"
                        aria-checked={kind === k.id}
                        onClick={() => setKind(k.id)}
                        className={cn(
                            'h-8 rounded-full border px-3 text-sm',
                            kind === k.id ? 'bg-foreground text-background border-foreground' : 'border-border'
                        )}
                    >
                        {k.label}
                    </button>
                ))}
            </div>
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholder}
                maxLength={2000}
                rows={4}
                aria-label="Your feedback"
            />
            <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email, if you'd like a reply (optional)"
                maxLength={200}
                autoComplete="email"
                aria-label="Contact (optional)"
            />
            {status === 'error' && (
                <p className="text-destructive m-0 text-sm">Couldn&apos;t send it. Try again?</p>
            )}
            <div className="flex gap-2">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => setIsOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-full" disabled={!message.trim() || status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send'}
                </Button>
            </div>
        </form>
    );
}
