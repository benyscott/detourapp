-- BAN-165: rate limiting and reproduction context for feedback

ALTER TABLE public.feedback
  -- sha256 of IP + user agent: counts bursts without storing the IP
  ADD COLUMN client_key text,
  -- screen size, destination name, path: what's needed to reproduce a bug
  ADD COLUMN context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX feedback_client_key_created_at_idx
  ON public.feedback (client_key, created_at DESC);
