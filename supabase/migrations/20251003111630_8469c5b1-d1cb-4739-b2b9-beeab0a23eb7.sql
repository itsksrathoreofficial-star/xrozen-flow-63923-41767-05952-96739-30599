-- Add invoice_id column to projects table if it doesn't exist
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;