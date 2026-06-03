
-- 1. Rename columns to match application code
ALTER TABLE public.orders RENAME COLUMN shipping_name TO customer_name;
ALTER TABLE public.orders RENAME COLUMN shipping_email TO customer_email;
ALTER TABLE public.orders RENAME COLUMN shipping_phone TO customer_phone;
ALTER TABLE public.orders RENAME COLUMN shipping_address_line1 TO shipping_address;
ALTER TABLE public.orders RENAME COLUMN shipping_address_line2 TO shipping_address2;
ALTER TABLE public.orders RENAME COLUMN shipping_postal_code TO shipping_pincode;
ALTER TABLE public.orders RENAME COLUMN items TO line_items;
ALTER TABLE public.orders RENAME COLUMN tax TO gst_amount;
ALTER TABLE public.orders RENAME COLUMN shipping_fee TO shipping_amount;
ALTER TABLE public.orders RENAME COLUMN total TO total_amount;
ALTER TABLE public.orders RENAME COLUMN courier_partner TO courier_name;
ALTER TABLE public.orders RENAME COLUMN admin_notes TO notes;

-- 2. Relax NOT NULL where TS types allow null
ALTER TABLE public.orders ALTER COLUMN customer_phone DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN shipping_address DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN shipping_city DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN shipping_state DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN shipping_pincode DROP NOT NULL;

-- 3. Add missing columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS estimated_delivery text,
  ADD COLUMN IF NOT EXISTS order_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.orders
  SET order_number = 'MVLT-' || upper(substr(id::text, 1, 8))
  WHERE order_number IS NULL;

ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- 4. Drop unused columns
ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_country;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS processing_at;
ALTER TABLE public.orders DROP COLUMN IF EXISTS cancelled_at;

-- 5. Replace enum with lowercase canonical values
ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN status TYPE text USING status::text;
DROP TYPE IF EXISTS public.order_status;
CREATE TYPE public.order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'
);
ALTER TABLE public.orders
  ALTER COLUMN status TYPE public.order_status
  USING (
    CASE lower(status)
      WHEN 'pending' THEN 'pending'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'processing' THEN 'processing'
      WHEN 'packed' THEN 'packed'
      WHEN 'shipped' THEN 'shipped'
      WHEN 'out for delivery' THEN 'out_for_delivery'
      WHEN 'out_for_delivery' THEN 'out_for_delivery'
      WHEN 'delivered' THEN 'delivered'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'pending'
    END
  )::public.order_status;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- 6. Refresh status-timestamp trigger to use new enum values
DROP FUNCTION IF EXISTS public.handle_order_status_timestamps() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_order_status_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'confirmed' THEN NEW.confirmed_at = COALESCE(NEW.confirmed_at, now());
    WHEN 'shipped' THEN NEW.shipped_at = COALESCE(NEW.shipped_at, now());
    WHEN 'delivered' THEN NEW.delivered_at = COALESCE(NEW.delivered_at, now());
    ELSE NULL;
  END CASE;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_status_timestamps
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_timestamps();

-- 7. Inventory sync — decrement product stock on new order
CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty int;
BEGIN
  IF NEW.line_items IS NULL OR jsonb_typeof(NEW.line_items) <> 'array' THEN
    RETURN NEW;
  END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.line_items) LOOP
    BEGIN
      pid := (item->>'product_id')::uuid;
    EXCEPTION WHEN others THEN
      pid := NULL;
    END;
    qty := COALESCE((item->>'quantity')::int, 1);
    IF pid IS NOT NULL THEN
      UPDATE public.products
        SET stock = GREATEST(0, stock - qty)
        WHERE id = pid;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_decrement_stock
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock_on_order();

-- 8. Public order lookup RPC (no anon SELECT on orders table)
CREATE OR REPLACE FUNCTION public.lookup_order_public(p_order_number text, p_email text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE order_number = upper(trim(p_order_number))
    AND lower(customer_email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_order_public(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_order_public(text, text) TO anon, authenticated;

-- 9. RLS policies — replace stale admin check with has_role()
DROP POLICY IF EXISTS "Admins have full access to all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

CREATE POLICY "Admins full access on orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow both authenticated owners AND guest checkout (user_id NULL) inserts
CREATE POLICY "Anyone can create order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id IS NULL
  );

-- 10. Data API grants on orders
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

-- 11. Realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 12. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(lower(customer_email));
