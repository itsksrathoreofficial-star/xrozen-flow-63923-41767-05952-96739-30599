-- Add missing columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS proceed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Drop year column if it exists and keep only month
ALTER TABLE public.invoices DROP COLUMN IF EXISTS year;