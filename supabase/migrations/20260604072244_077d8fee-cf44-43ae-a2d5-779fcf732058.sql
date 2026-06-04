
-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'order',
  title text NOT NULL,
  message text,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_order_unique_idx
  ON public.notifications (order_id, type) WHERE order_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- Trigger: auto-create notification on new order
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, order_id, metadata)
  VALUES (
    'order',
    'New order ' || NEW.order_number,
    NEW.customer_name || ' placed an order for ₹' || NEW.total_amount::text,
    NEW.id,
    jsonb_build_object(
      'order_number', NEW.order_number,
      'customer_name', NEW.customer_name,
      'customer_email', NEW.customer_email,
      'total_amount', NEW.total_amount,
      'status', NEW.status
    )
  )
  ON CONFLICT (order_id, type) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_create_notification ON public.orders;
CREATE TRIGGER trg_orders_create_notification
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_order_notification();
