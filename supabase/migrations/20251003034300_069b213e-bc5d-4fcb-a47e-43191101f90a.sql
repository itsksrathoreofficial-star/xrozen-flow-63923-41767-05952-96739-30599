-- Create function to sync user_category with user_roles
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing role
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  -- Insert new role based on user_category
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.user_category::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync user_category changes
CREATE TRIGGER sync_user_category_to_role
AFTER UPDATE OF user_category ON public.profiles
FOR EACH ROW
WHEN (OLD.user_category IS DISTINCT FROM NEW.user_category)
EXECUTE FUNCTION public.sync_user_role();