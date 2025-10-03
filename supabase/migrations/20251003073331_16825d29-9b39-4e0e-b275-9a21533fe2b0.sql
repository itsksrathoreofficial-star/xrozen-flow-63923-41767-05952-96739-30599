-- Create video_feedback table
CREATE TABLE IF NOT EXISTS public.video_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.video_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  timestamp_seconds INTEGER,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_feedback ENABLE ROW LEVEL SECURITY;

-- Replace policies safely
DROP POLICY IF EXISTS "Project creators can view feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Project creators can insert feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Project creators can update feedback" ON public.video_feedback;

CREATE POLICY "Project creators can view feedback"
ON public.video_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
      AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Project creators can insert feedback"
ON public.video_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = version_id
      AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Project creators can update feedback"
ON public.video_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
      AND p.creator_id = auth.uid()
  )
);

-- Timestamp trigger for updated_at using existing function
DROP TRIGGER IF EXISTS trg_video_feedback_updated_at ON public.video_feedback;
CREATE TRIGGER trg_video_feedback_updated_at
BEFORE UPDATE ON public.video_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime support
ALTER TABLE public.video_feedback REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_feedback;