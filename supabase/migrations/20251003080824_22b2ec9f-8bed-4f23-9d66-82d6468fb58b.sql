-- Add approval_status and final_link_requested columns to video_versions table
ALTER TABLE public.video_versions
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS final_link_requested BOOLEAN DEFAULT false;

-- Update existing records to have approval_status based on is_approved
UPDATE public.video_versions
SET approval_status = CASE 
  WHEN is_approved = true THEN 'approved'
  ELSE 'pending'
END
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_video_versions_approval_status ON public.video_versions(approval_status);