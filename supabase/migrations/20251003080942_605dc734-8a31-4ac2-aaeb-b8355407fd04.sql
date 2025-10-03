-- Drop the existing foreign key constraint
ALTER TABLE public.video_versions
DROP CONSTRAINT IF EXISTS video_versions_uploaded_by_fkey;

-- Add new foreign key constraint referencing auth.users instead
ALTER TABLE public.video_versions
ADD CONSTRAINT video_versions_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;