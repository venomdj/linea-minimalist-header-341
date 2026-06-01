
-- Fix function search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Lock down has_role to non-public callers (RLS policies still work because SECURITY DEFINER
-- runs as owner). Revoke from anon and authenticated direct execution.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- Replace broad bucket SELECT policy with a no-list policy. Public read of individual objects via
-- the public bucket URL still works (it goes through storage's render endpoint, not a listing query).
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
