
CREATE OR REPLACE FUNCTION public.place_order_atomic(p_order jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item     jsonb;
  v_pid      uuid;
  v_qty      int;
  v_stock    int;
  v_title    text;
  v_reserved int;
  v_order    public.orders%ROWTYPE;
  v_items    jsonb := COALESCE(p_order->'line_items', '[]'::jsonb);
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

    -- Lock the product row (no modification) so concurrent checkouts serialize
    SELECT stock, title INTO v_stock, v_title
    FROM public.products WHERE id = v_pid FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNAVAILABLE:%:0', COALESCE(v_item->>'title', 'Item');
    END IF;

    -- Quantity already reserved by orders awaiting approval (stock not yet deducted)
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

  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_address2, shipping_city, shipping_state, shipping_pincode,
    line_items, subtotal, gst_amount, shipping_amount, total_amount,
    payment_method, payment_status, status, order_date, stock_deducted
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
    COALESCE((p_order->>'subtotal')::numeric, 0),
    COALESCE((p_order->>'gst_amount')::numeric, 0),
    COALESCE((p_order->>'shipping_amount')::numeric, 0),
    COALESCE((p_order->>'total_amount')::numeric, 0),
    COALESCE(p_order->>'payment_method', 'upi'),
    COALESCE(p_order->>'payment_status', 'pending'),
    'pending'::order_status,
    COALESCE((p_order->>'order_date')::timestamptz, now()),
    false
  ) RETURNING * INTO v_order;

  RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number);
END;
$function$;
