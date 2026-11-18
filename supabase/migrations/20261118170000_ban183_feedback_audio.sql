-- BAN-183: voice notes on feedback

ALTER TABLE public.feedback
  ADD COLUMN audio_path text,
  ADD COLUMN audio_mime text,
  ADD COLUMN audio_duration_s integer CHECK (audio_duration_s IS NULL OR audio_duration_s BETWEEN 0 AND 600),
  ALTER COLUMN message DROP NOT NULL,
  ADD CONSTRAINT feedback_message_or_audio_check
    CHECK (message IS NOT NULL OR audio_path IS NOT NULL);

-- Private bucket: written and read only with the service role (dashboard to listen).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-audio',
  'feedback-audio',
  false,
  4194304, -- 4 MB; 2 minutes at 64 kbps is about 1 MB
  ARRAY['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;
