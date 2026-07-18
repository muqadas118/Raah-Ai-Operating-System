
CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('quiz','assignment','project')),
  milestone_id text,
  milestone_title text,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  submission jsonb,
  score integer,
  max_score integer NOT NULL DEFAULT 100,
  points_awarded integer NOT NULL DEFAULT 0,
  feedback jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','evaluated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own evaluations" ON public.evaluations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER evaluations_set_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX evaluations_user_created_idx ON public.evaluations (user_id, created_at DESC);
