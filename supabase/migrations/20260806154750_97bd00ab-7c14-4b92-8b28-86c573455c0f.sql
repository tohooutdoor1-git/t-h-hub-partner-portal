
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin" ON public.app_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (key, value) VALUES
  ('inventory_thresholds', '{"available_min": 11, "low_min": 1}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  title text,
  subtitle text,
  button_label text,
  link_url text,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners read" ON public.banners FOR SELECT TO authenticated USING (active OR public.is_admin());
CREATE POLICY "banners admin" ON public.banners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estado de inventario automático
CREATE OR REPLACE FUNCTION public.apply_stock_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cfg jsonb;
  avail_min integer;
  low_min integer;
BEGIN
  IF NEW.stock_status = 'inquire' AND (TG_OP = 'INSERT' OR OLD.stock IS NOT DISTINCT FROM NEW.stock) THEN
    RETURN NEW;
  END IF;
  SELECT value INTO cfg FROM public.app_settings WHERE key = 'inventory_thresholds';
  avail_min := COALESCE((cfg->>'available_min')::int, 11);
  low_min := COALESCE((cfg->>'low_min')::int, 1);
  IF NEW.stock >= avail_min THEN
    NEW.stock_status := 'available';
  ELSIF NEW.stock >= low_min THEN
    NEW.stock_status := 'low';
  ELSE
    NEW.stock_status := 'out';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_products_stock_status ON public.products;
CREATE TRIGGER trg_products_stock_status BEFORE INSERT OR UPDATE OF stock, stock_status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_status();

-- Folios
CREATE SEQUENCE IF NOT EXISTS public.quote_folio_seq;
CREATE SEQUENCE IF NOT EXISTS public.order_folio_seq;

CREATE OR REPLACE FUNCTION public.next_folio(_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint;
BEGIN
  IF _prefix = 'COT' THEN
    n := nextval('public.quote_folio_seq');
  ELSE
    n := nextval('public.order_folio_seq');
  END IF;
  RETURN _prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
END; $$;
GRANT EXECUTE ON FUNCTION public.next_folio(text) TO authenticated, service_role;

-- Aprobación de pedido con descuento de inventario seguro
CREATE OR REPLACE FUNCTION public.approve_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  it record;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado'; END IF;
  IF NOT (public.is_admin() OR o.seller_id = public.my_seller_id()) THEN
    RAISE EXCEPTION 'No tienes permiso para aprobar este pedido';
  END IF;
  IF o.inventory_applied THEN
    RETURN jsonb_build_object('ok', true, 'already_applied', true);
  END IF;

  FOR it IN
    SELECT oi.product_id, sum(oi.quantity) AS qty
    FROM public.order_items oi
    WHERE oi.order_id = _order_id AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    PERFORM 1 FROM public.products WHERE id = it.product_id FOR UPDATE;
    UPDATE public.products SET stock = GREATEST(stock - it.qty, 0) WHERE id = it.product_id;
  END LOOP;

  UPDATE public.orders
    SET status = 'approved', inventory_applied = true
    WHERE id = _order_id;

  UPDATE public.distributors
    SET accumulated_purchases = accumulated_purchases + o.total,
        last_activity = now()
    WHERE id = o.distributor_id;

  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.approve_order(uuid) TO authenticated, service_role;
