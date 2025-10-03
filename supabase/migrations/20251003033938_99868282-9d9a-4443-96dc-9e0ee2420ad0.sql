-- Add RLS policies for project_clients table
CREATE POLICY "Users can view project clients they're part of"
ON public.project_clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND creator_id = auth.uid()
  ) OR client_id = auth.uid()
);

CREATE POLICY "Project creators can manage project clients"
ON public.project_clients
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND creator_id = auth.uid()
  )
);

-- Add RLS policies for video_versions table
CREATE POLICY "Users can view video versions for their projects"
ON public.video_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Project creators can manage video versions"
ON public.video_versions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND creator_id = auth.uid()
  )
);