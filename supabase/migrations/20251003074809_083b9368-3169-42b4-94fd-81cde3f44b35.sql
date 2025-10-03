-- Add missing columns to video_versions table
ALTER TABLE public.video_versions 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS final_link_requested BOOLEAN DEFAULT false;

-- Add check constraint for approval_status values
ALTER TABLE public.video_versions
ADD CONSTRAINT approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'corrections_needed'));