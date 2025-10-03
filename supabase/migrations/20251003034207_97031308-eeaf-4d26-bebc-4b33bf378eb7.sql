-- Update handle_new_user function to save user_category from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_category)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'user_category')::user_category, 'editor'::user_category)
  );
  RETURN new;
END;
$$;

-- Update handle_new_user_role to assign role based on user_category
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the user_category from metadata and map it to app_role
  user_role := COALESCE((NEW.raw_user_meta_data->>'user_category')::app_role, 'editor'::app_role);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;