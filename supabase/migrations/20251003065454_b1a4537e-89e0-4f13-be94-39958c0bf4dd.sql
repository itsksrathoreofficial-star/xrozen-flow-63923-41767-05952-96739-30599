-- Add approval status and final link request to video_versions
ALTER TABLE video_versions 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'corrections_needed', 'rejected')),
ADD COLUMN IF NOT EXISTS final_link_requested boolean DEFAULT false;

-- Create table for timestamped video feedback/comments
CREATE TABLE IF NOT EXISTS video_feedback (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  version_id uuid NOT NULL REFERENCES video_versions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  timestamp_seconds numeric,
  comment_text text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on video_feedback
ALTER TABLE video_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feedback for projects they're part of
CREATE POLICY "Users can view feedback for their projects"
ON video_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM video_versions vv
    JOIN projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
    AND p.creator_id = auth.uid()
  )
);

-- Policy: Users can add feedback for projects they're part of
CREATE POLICY "Users can add feedback for their projects"
ON video_feedback FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM video_versions vv
    JOIN projects p ON p.id = vv.project_id
    WHERE vv.id = video_feedback.version_id
    AND p.creator_id = auth.uid()
  )
);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON video_feedback FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
ON video_feedback FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updating updated_at
CREATE TRIGGER update_video_feedback_updated_at
BEFORE UPDATE ON video_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();