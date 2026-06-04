
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  event text NOT NULL,
  recipient text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('customer','admin')),
  subject text,
  idempotency_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed')),
  resend_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_log_idempotency_idx
  ON public.email_log (idempotency_key) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS email_log_order_idx ON public.email_log (order_id);
CREATE INDEX IF NOT EXISTS email_log_created_idx ON public.email_log (created_at DESC);

GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
