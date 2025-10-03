-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.editors CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.project_types CASCADE;
DROP TYPE IF EXISTS public.employment_type CASCADE;

-- Create employment type enum
CREATE TYPE public.employment_type AS ENUM ('fulltime', 'freelance');

-- Create project type table for autocomplete suggestions
CREATE TABLE public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project types"
ON public.project_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can insert project types"
ON public.project_types FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create editors table
CREATE TABLE public.editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT,
  employment_type employment_type NOT NULL DEFAULT 'freelance',
  hourly_rate DECIMAL(10,2),
  monthly_salary DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.editors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all editors"
ON public.editors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert editors"
ON public.editors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update editors"
ON public.editors FOR UPDATE
TO authenticated
USING (true);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  employment_type employment_type NOT NULL DEFAULT 'freelance',
  project_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (true);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  editor_id UUID REFERENCES public.editors(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_footage_link TEXT,
  assigned_date DATE,
  deadline DATE,
  fee DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  parent_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_subproject BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their projects"
ON public.projects FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Users can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their projects"
ON public.projects FOR UPDATE
TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their projects"
ON public.projects FOR DELETE
TO authenticated
USING (creator_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_editors_updated_at
BEFORE UPDATE ON public.editors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();