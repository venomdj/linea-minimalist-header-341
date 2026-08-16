
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
  v_before   int;
  v_after    int;
  v_title    text;
  v_order    public.orders%ROWTYPE;
  v_items    jsonb := COALESCE(p_order->'line_items', '[]'::jsonb);
BEGIN
  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  -- Lock every product row in a deterministic order (prevents deadlocks)
  FOR v_item IN
    SELECT value FROM jsonb_array_elements(v_items) ORDER BY value->>'product_id'
  LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::int, 0);

    IF v_pid IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_ITEM';
    END IF;

    SELECT stock, title INTO v_before, v_title
    FROM public.products WHERE id = v_pid FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNAVAILABLE:%:0', COALESCE(v_item->>'title', 'Item');
    END IF;

    IF v_before < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%:%', v_title, v_before;
    END IF;

    v_after := v_before - v_qty;

    UPDATE public.products
      SET stock = v_after,
          in_stock = (v_after > 0)
      WHERE id = v_pid;

    INSERT INTO public.stock_log (product_id, change_type, quantity, stock_before, stock_after, note)
    VALUES (v_pid, 'reserve', v_qty, v_before, v_after, 'reserved at order placement');
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
    true
  ) RETURNING * INTO v_order;

  UPDATE public.stock_log SET order_id = v_order.id
  WHERE order_id IS NULL AND change_type = 'reserve'
    AND created_at > now() - interval '1 minute'
    AND product_id IN (
      SELECT (value->>'product_id')::uuid FROM jsonb_array_elements(v_items)
    );

  RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number);
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_atomic(jsonb) TO anon, authenticated;

-- Return stock to inventory when an order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item   jsonb;
  v_pid    uuid;
  v_qty    int;
  v_before int;
BEGIN
  IF NEW.status <> 'cancelled' OR OLD.status = 'cancelled' OR NOT OLD.stock_deducted THEN
    RETURN NEW;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(NEW.line_items, '[]'::jsonb)) LOOP
    BEGIN
      v_pid := (v_item->>'product_id')::uuid;
    EXCEPTION WHEN others THEN v_pid := NULL;
    END;
    v_qty := COALESCE((v_item->>'quantity')::int, 0);
    IF v_pid IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    SELECT stock INTO v_before FROM public.products WHERE id = v_pid FOR UPDATE;
    IF NOT FOUND THEN CONTINUE; END IF;

    UPDATE public.products
      SET stock = v_before + v_qty,
          in_stock = true
      WHERE id = v_pid;

    INSERT INTO public.stock_log (product_id, order_id, change_type, quantity, stock_before, stock_after, note)
    VALUES (v_pid, NEW.id, 'restore', v_qty, v_before, v_before + v_qty, 'order cancelled');
  END LOOP;

  NEW.stock_deducted := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_restore_stock_on_cancel ON public.orders;
CREATE TRIGGER trg_orders_restore_stock_on_cancel
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();
