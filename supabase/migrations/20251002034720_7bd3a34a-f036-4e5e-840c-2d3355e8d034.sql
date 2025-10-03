-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_category AS ENUM ('editor', 'client', 'agency');
CREATE TYPE subscription_tier AS ENUM ('basic', 'pro', 'premium');
CREATE TYPE project_status AS ENUM ('draft', 'in_review', 'approved', 'completed');
CREATE TYPE payment_type AS ENUM ('freelance', 'fulltime');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_category user_category NOT NULL DEFAULT 'editor',
  subscription_tier subscription_tier NOT NULL DEFAULT 'basic',
  subscription_active BOOLEAN NOT NULL DEFAULT true,
  trial_end_date TIMESTAMPTZ,
  subscription_start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status project_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project_clients junction table
CREATE TABLE public.project_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, client_id)
);

-- Create video_versions table
CREATE TABLE public.video_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  preview_url TEXT,
  final_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  correction_notes TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  payer_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_type payment_type NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  invoice_url TEXT,
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create database_config table for admin
CREATE TABLE public.database_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'supabase',
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Editors can view own projects"
  ON public.projects FOR SELECT
  USING (editor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.project_clients 
    WHERE project_id = id AND client_id = auth.uid()
  ));

CREATE POLICY "Editors can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = editor_id);

CREATE POLICY "Editors can update own projects"
  ON public.projects FOR UPDATE
  USING (editor_id = auth.uid());

CREATE POLICY "Editors can delete own projects"
  ON public.projects FOR DELETE
  USING (editor_id = auth.uid());

-- RLS Policies for project_clients
CREATE POLICY "Users can view project clients"
  ON public.project_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND (editor_id = auth.uid() OR client_id = auth.uid())
  ));

CREATE POLICY "Editors can manage project clients"
  ON public.project_clients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND editor_id = auth.uid()
  ));

-- RLS Policies for video_versions
CREATE POLICY "Users can view project videos"
  ON public.video_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND (
      p.editor_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.project_clients WHERE project_id = p.id AND client_id = auth.uid())
    )
  ));

CREATE POLICY "Editors can manage videos"
  ON public.video_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND editor_id = auth.uid()
  ));

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (payer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (payer_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  USING (payer_id = auth.uid() OR recipient_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Database config policies (admin only - will be enhanced later)
CREATE POLICY "Anyone can view database config"
  ON public.database_config FOR SELECT
  USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_versions_updated_at
  BEFORE UPDATE ON public.video_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default database config
INSERT INTO public.database_config (provider, config, is_active)
VALUES ('supabase', '{"name": "Lovable Cloud (Supabase)", "status": "active"}', true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;