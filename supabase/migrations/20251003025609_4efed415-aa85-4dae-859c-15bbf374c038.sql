-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('editor', 'client', 'agency');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Create editors table
CREATE TABLE public.editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT,
  hourly_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

ALTER TABLE public.editors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors and agencies can view editors"
ON public.editors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') OR 
  public.has_role(auth.uid(), 'agency') OR
  public.has_role(auth.uid(), 'client')
);

CREATE POLICY "Agencies can manage editors"
ON public.editors
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'agency'));

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors and agencies can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') OR 
  public.has_role(auth.uid(), 'agency') OR
  user_id = auth.uid()
);

CREATE POLICY "Editors and agencies can manage clients"
ON public.clients
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') OR 
  public.has_role(auth.uid(), 'agency')
);

-- Trigger for updated_at
CREATE TRIGGER update_editors_updated_at
BEFORE UPDATE ON public.editors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();