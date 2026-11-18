-- BAN-165: in-app feedback (bugs, ideas, kind words)

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  kind text NOT NULL CHECK (kind IN ('bug', 'idea', 'love', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  contact text CHECK (contact IS NULL OR char_length(contact) <= 200),
  -- Coarse context only: town name, never coordinates
  town text,
  app_version text,
  user_agent text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_created_at_idx ON public.feedback (created_at DESC);

-- Written only through /api/feedback with the service role: no public policies.
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
