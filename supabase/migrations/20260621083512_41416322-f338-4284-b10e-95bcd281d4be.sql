-- Explicitly deny client-side UPDATE and DELETE on user_roles to prevent privilege escalation.
-- Role changes must go through admin-only server-side code (service_role bypasses RLS).
CREATE POLICY "Deny client UPDATE on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny client DELETE on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);