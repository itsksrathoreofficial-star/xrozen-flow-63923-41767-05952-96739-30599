-- Drop existing types if they exist and recreate them
DO $$ BEGIN
  DROP TYPE IF EXISTS invoice_status CASCADE;
  CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'partial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  DROP TYPE IF EXISTS transaction_type CASCADE;
  CREATE TYPE transaction_type AS ENUM ('expense', 'payment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status invoice_status NOT NULL DEFAULT 'pending',
  proceed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type transaction_type NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_projects junction table
CREATE TABLE IF NOT EXISTS public.invoice_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_fee NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invoice_id, project_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_editor_id ON public.invoices(editor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON public.invoices(month);
CREATE INDEX IF NOT EXISTS idx_transactions_editor_id ON public.transactions(editor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON public.transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_projects_invoice_id ON public.invoice_projects(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_projects_project_id ON public.invoice_projects(project_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
CREATE POLICY "Users can create their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = editor_id);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = editor_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = editor_id);

-- RLS Policies for invoice_projects
DROP POLICY IF EXISTS "Users can view invoice projects for their invoices" ON public.invoice_projects;
CREATE POLICY "Users can view invoice projects for their invoices"
  ON public.invoice_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_projects.invoice_id
      AND invoices.editor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create invoice projects for their invoices" ON public.invoice_projects;
CREATE POLICY "Users can create invoice projects for their invoices"
  ON public.invoice_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_projects.invoice_id
      AND invoices.editor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update invoice projects for their invoices" ON public.invoice_projects;
CREATE POLICY "Users can update invoice projects for their invoices"
  ON public.invoice_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_projects.invoice_id
      AND invoices.editor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete invoice projects for their invoices" ON public.invoice_projects;
CREATE POLICY "Users can delete invoice projects for their invoices"
  ON public.invoice_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_projects.invoice_id
      AND invoices.editor_id = auth.uid()
    )
  );

-- Triggers
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();