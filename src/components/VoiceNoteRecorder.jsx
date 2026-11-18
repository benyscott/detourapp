'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const MAX_SECONDS = 120;
// iOS Safari only records mp4/AAC; Chrome and Firefox prefer webm/Opus
const MIME_CANDIDATES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

const canRecord = () =>
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);

const pickMimeType = () => MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';

const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Voice note for feedback (BAN-183). Tap to record, tap to stop; 2 minutes max.
 * Calls onChange({ blob, durationS }) when a recording is ready, onChange(null) when deleted.
 * Disappears quietly if the browser can't record or the mic is refused.
 */
export default function VoiceNoteRecorder({ onChange, disabled }) {
    const [state, setState] = useState('idle'); // idle | starting | recording | recorded | blocked
    const [seconds, setSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const startedAtRef = useRef(0);
    const audioUrlRef = useRef(null);

    const releaseMic = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // Stopping the tracks removes iOS's red mic indicator
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    // Leaving Settings mid-recording: stop everything, free the playback URL
    useEffect(
        () => () => {
            const recorder = recorderRef.current;
            if (recorder && recorder.state !== 'inactive') {
                recorder.onstop = null;
                recorder.stop();
            }
            releaseMic();
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        },
        []
    );

    const stop = () => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
    };

    const start = async () => {
        setState('starting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = pickMimeType();
            const recorder = new MediaRecorder(stream, {
                ...(mimeType ? { mimeType } : {}),
                audioBitsPerSecond: 64000,
            });
            const chunks = [];
            recorder.ondataavailable = (event) => {
                if (event.data?.size) chunks.push(event.data);
            };
            recorder.onstop = () => {
                const durationS = Math.min(MAX_SECONDS, Math.round((Date.now() - startedAtRef.current) / 1000));
                releaseMic();
                const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/mp4' });
                if (!blob.size) {
                    setState('idle');
                    return;
                }
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                setAudioUrl(url);
                setSeconds(durationS);
                setState('recorded');
                onChange?.({ blob, durationS });
            };
            recorderRef.current = recorder;
            startedAtRef.current = Date.now();
            setSeconds(0);
            recorder.start(1000);
            setState('recording');
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
                setSeconds(elapsed);
                if (elapsed >= MAX_SECONDS) stop();
            }, 250);
        } catch (error) {
            console.warn('[Feedback] Microphone unavailable:', error);
            releaseMic();
            setState('blocked');
        }
    };

    const discard = () => {
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        setAudioUrl(null);
        setSeconds(0);
        setState('idle');
        onChange?.(null);
    };

    if (state === 'blocked' || !canRecord()) return null;

    if (state === 'recorded') {
        return (
            <div className="flex items-center gap-2">
                <audio src={audioUrl} controls preload="metadata" className="h-9 min-w-0 flex-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={discard}
                    disabled={disabled}
                >
                    Delete
                </Button>
            </div>
        );
    }

    if (state === 'recording') {
        return (
            <Button type="button" variant="outline" className="w-full gap-2 rounded-full" onClick={stop}>
                <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                <span className="tabular-nums">
                    {formatSeconds(seconds)} / {formatSeconds(MAX_SECONDS)}
                </span>
                <span>· Tap to stop</span>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={start}
            disabled={disabled || state === 'starting'}
        >
            🎙️ Or just say it
        </Button>
    );
}
