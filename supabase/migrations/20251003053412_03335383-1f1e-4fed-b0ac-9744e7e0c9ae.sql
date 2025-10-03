-- Add approval status enum and column to video_versions
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'corrections_needed');

ALTER TABLE public.video_versions 
ADD COLUMN IF NOT EXISTS approval_status public.approval_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS final_link_requested BOOLEAN DEFAULT FALSE;

-- Update existing records
UPDATE public.video_versions 
SET approval_status = CASE 
  WHEN is_approved = true THEN 'approved'::approval_status
  ELSE 'pending'::approval_status
END
WHERE approval_status IS NULL;