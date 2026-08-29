
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  per_user_limit integer,
  starts_at timestamptz,
  expires_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_type_check CHECK (discount_type IN ('percentage','fixed')),
  CONSTRAINT promo_codes_value_check CHECK (discount_value > 0)
);

CREATE UNIQUE INDEX promo_codes_code_key ON public.promo_codes (upper(code));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER promo_codes_set_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid,
  customer_email text,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_code_redemptions TO authenticated;
GRANT ALL ON public.promo_code_redemptions TO service_role;

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view redemptions" ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

-- Shared discount computation
CREATE OR REPLACE FUNCTION public.compute_promo_discount(p_code public.promo_codes, p_subtotal numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT LEAST(
    CASE
      WHEN p_code.discount_type = 'percentage'
        THEN ROUND(p_subtotal * p_code.discount_value / 100.0)
      ELSE p_code.discount_value
    END,
    COALESCE(p_code.max_discount, 1e12),
    p_subtotal
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code text, p_subtotal numeric, p_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.promo_codes%ROWTYPE;
  v_uses int;
  v_discount numeric;
BEGIN
  SELECT * INTO c FROM public.promo_codes
  WHERE upper(code) = upper(trim(coalesce(p_code, ''))) LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid', 'message', 'This promo code does not exist.');
  END IF;

  IF NOT c.enabled THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'disabled', 'message', 'This promo code is no longer active.');
  END IF;

  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_started', 'message', 'This promo code is not active yet.');
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'message', 'This promo code has expired.');
  END IF;

  IF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'limit_reached', 'message', 'This promo code has reached its usage limit.');
  END IF;

  IF p_subtotal < c.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'min_order',
      'message', 'Minimum order value of ' || c.min_order_value::int || ' required for this code.',
      'min_order_value', c.min_order_value);
  END IF;

  IF c.per_user_limit IS NOT NULL AND coalesce(trim(p_email), '') <> '' THEN
    SELECT count(*) INTO v_uses FROM public.promo_code_redemptions r
    WHERE r.promo_code_id = c.id AND lower(r.customer_email) = lower(trim(p_email));
    IF v_uses >= c.per_user_limit THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'user_limit', 'message', 'You have already used this promo code.');
    END IF;
  END IF;

  v_discount := public.compute_promo_discount(c, p_subtotal);

  RETURN jsonb_build_object(
    'valid', true,
    'code', upper(c.code),
    'description', c.description,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'discount', v_discount,
    'message', 'Promo code applied.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric, text) TO anon, authenticated, service_role;

-- Order placement with promo support
CREATE OR REPLACE FUNCTION public.place_order_atomic(p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item     jsonb;
  v_pid      uuid;
  v_qty      int;
  v_stock    int;
  v_title    text;
  v_reserved int;
  v_order    public.orders%ROWTYPE;
  v_items    jsonb := COALESCE(p_order->'line_items', '[]'::jsonb);
  v_promo    text  := NULLIF(trim(COALESCE(p_order->>'promo_code','')), '');
  v_pc       public.promo_codes%ROWTYPE;
  v_check    jsonb;
  v_discount numeric := 0;
  v_subtotal numeric := COALESCE((p_order->>'subtotal')::numeric, 0);
BEGIN
  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(v_items) ORDER BY value->>'product_id'
  LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::int, 0);

    IF v_pid IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_ITEM';
    END IF;

    SELECT stock, title INTO v_stock, v_title
    FROM public.products WHERE id = v_pid FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNAVAILABLE:%:0', COALESCE(v_item->>'title', 'Item');
    END IF;

    SELECT COALESCE(SUM(COALESCE((li->>'quantity')::int, 0)), 0)
    INTO v_reserved
    FROM public.orders o
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.line_items, '[]'::jsonb)) AS li
    WHERE o.stock_deducted = false
      AND o.status NOT IN ('cancelled', 'delivered')
      AND (li->>'product_id') = v_pid::text;

    IF (v_stock - v_reserved) < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%:%', v_title, GREATEST(v_stock - v_reserved, 0);
    END IF;
  END LOOP;

  IF v_promo IS NOT NULL THEN
    SELECT * INTO v_pc FROM public.promo_codes
    WHERE upper(code) = upper(v_promo) FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROMO_INVALID:This promo code does not exist.';
    END IF;

    v_check := public.validate_promo_code(v_promo, v_subtotal, p_order->>'customer_email');
    IF NOT (v_check->>'valid')::boolean THEN
      RAISE EXCEPTION 'PROMO_INVALID:%', v_check->>'message';
    END IF;

    v_discount := public.compute_promo_discount(v_pc, v_subtotal);
  END IF;

  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_address2, shipping_city, shipping_state, shipping_pincode,
    line_items, subtotal, gst_amount, shipping_amount, total_amount,
    payment_method, payment_status, status, order_date, stock_deducted,
    promo_code, discount_amount
  ) VALUES (
    p_order->>'order_number',
    NULLIF(p_order->>'user_id','')::uuid,
    p_order->>'customer_name',
    lower(p_order->>'customer_email'),
    p_order->>'customer_phone',
    p_order->>'shipping_address',
    NULLIF(p_order->>'shipping_address2',''),
    p_order->>'shipping_city',
    p_order->>'shipping_state',
    p_order->>'shipping_pincode',
    v_items,
    v_subtotal,
    COALESCE((p_order->>'gst_amount')::numeric, 0),
    COALESCE((p_order->>'shipping_amount')::numeric, 0),
    GREATEST(COALESCE((p_order->>'total_amount')::numeric, 0), 0),
    COALESCE(p_order->>'payment_method', 'upi'),
    COALESCE(p_order->>'payment_status', 'pending'),
    'pending'::order_status,
    COALESCE((p_order->>'order_date')::timestamptz, now()),
    false,
    CASE WHEN v_promo IS NULL THEN NULL ELSE upper(v_promo) END,
    v_discount
  ) RETURNING * INTO v_order;

  IF v_promo IS NOT NULL THEN
    UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = v_pc.id;
    INSERT INTO public.promo_code_redemptions (promo_code_id, order_id, user_id, customer_email, discount_amount)
    VALUES (v_pc.id, v_order.id, NULLIF(p_order->>'user_id','')::uuid, lower(p_order->>'customer_email'), v_discount);
  END IF;

  RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'discount', v_discount);
END;
$$;
