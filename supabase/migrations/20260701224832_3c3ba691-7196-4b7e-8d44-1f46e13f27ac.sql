
-- 1) Defer stock deduction until admin approval
DROP TRIGGER IF EXISTS trg_orders_decrement_stock ON public.orders;

CREATE OR REPLACE FUNCTION public.decrement_product_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item      jsonb;
  pid       uuid;
  qty       int;
  remaining int;
BEGIN
  -- Only run when the order transitions INTO 'confirmed' and stock hasn't been deducted yet
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status <> 'confirmed' OR OLD.status = 'confirmed' OR NEW.stock_deducted THEN
      RETURN NEW;
    END IF;
  ELSE
    -- Do nothing on plain inserts (orders start as pending; stock is only deducted upon approval)
    RETURN NEW;
  END IF;

  IF NEW.line_items IS NULL OR jsonb_typeof(NEW.line_items) <> 'array' THEN
    NEW.stock_deducted := true;
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.line_items) LOOP
    BEGIN
      pid := (item->>'product_id')::uuid;
    EXCEPTION WHEN others THEN
      pid := NULL;
    END;
    qty := COALESCE((item->>'quantity')::int, 1);

    IF pid IS NULL OR qty <= 0 THEN CONTINUE; END IF;

    UPDATE public.products
      SET stock    = stock - qty,
          in_stock = (stock - qty) > 0
      WHERE id = pid AND stock >= qty
      RETURNING stock INTO remaining;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', pid
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  NEW.stock_deducted := true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_decrement_stock
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock_on_order();

-- 2) Saved addresses (address book)
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label         text NOT NULL DEFAULT 'Home',
  full_name     text NOT NULL,
  phone         text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city          text NOT NULL,
  state         text NOT NULL,
  pincode       text NOT NULL,
  country       text NOT NULL DEFAULT 'India',
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_addresses TO authenticated;
GRANT ALL ON public.saved_addresses TO service_role;

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own addresses"
  ON public.saved_addresses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_saved_addresses_updated_at ON public.saved_addresses;
CREATE TRIGGER trg_saved_addresses_updated_at
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON public.saved_addresses(user_id);
