-- Add RLS Policies for api_keys (admin only)
CREATE POLICY "Admins can manage API keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS Policies for admin_activity_logs (admin only)
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS Policies for subscription_plans (admin write, all read)
CREATE POLICY "Everyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));