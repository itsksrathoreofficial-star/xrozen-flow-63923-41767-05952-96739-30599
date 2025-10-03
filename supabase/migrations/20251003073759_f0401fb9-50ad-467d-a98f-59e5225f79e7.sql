-- Broaden RLS to allow project creator, editor, and client to manage feedback
DROP POLICY IF EXISTS "Project creators can view feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Project creators can insert feedback" ON public.video_feedback;
DROP POLICY IF EXISTS "Project creators can update feedback" ON public.video_feedback;

CREATE POLICY "Project members can view feedback"
ON public.video_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
      AND (
        p.creator_id = auth.uid() OR
        p.editor_id = auth.uid() OR
        p.client_id = auth.uid()
      )
  )
);

CREATE POLICY "Project members can insert feedback"
ON public.video_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = version_id
      AND (
        p.creator_id = auth.uid() OR
        p.editor_id = auth.uid() OR
        p.client_id = auth.uid()
      )
  )
);

CREATE POLICY "Project members can update feedback"
ON public.video_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.video_versions vv
    JOIN public.projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
      AND (
        p.creator_id = auth.uid() OR
        p.editor_id = auth.uid() OR
        p.client_id = auth.uid()
      )
  )
);