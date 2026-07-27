CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  cta_label text,
  cta_link text,
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer NOT NULL DEFAULT 0,
  display_mode text NOT NULL DEFAULT 'both',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Anyone can view active announcements"
ON public.announcements FOR SELECT
TO anon, authenticated
USING (
  enabled = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
CREATE POLICY "Admins can view all announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_announcements_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;
CREATE TRIGGER announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.set_announcements_updated_at();

ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;