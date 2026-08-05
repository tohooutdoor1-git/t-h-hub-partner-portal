
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','seller','distributor');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VENDEDORES
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers read" ON public.sellers FOR SELECT TO authenticated USING (true);
CREATE POLICY "sellers admin write" ON public.sellers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_sellers_updated BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NIVELES
CREATE TABLE public.level_settings (
  code text PRIMARY KEY,
  name text NOT NULL,
  discount_pct numeric(5,2) NOT NULL,
  threshold numeric(14,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_settings TO authenticated;
GRANT ALL ON public.level_settings TO service_role;
ALTER TABLE public.level_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels read" ON public.level_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "levels admin write" ON public.level_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.level_settings (code,name,discount_pct,threshold,sort_order) VALUES
  ('BRONZE','Bronze',20,0,1),
  ('SILVER','Silver',25,150000,2),
  ('GOLD','Gold',30,300000,3);

-- DISTRIBUIDORES
CREATE TABLE public.distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  company text NOT NULL,
  rfc text,
  email text NOT NULL,
  phone text,
  address text,
  level_code text NOT NULL DEFAULT 'BRONZE' REFERENCES public.level_settings(code),
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  accumulated_purchases numeric(14,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  last_activity timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributors TO authenticated;
GRANT ALL ON public.distributors TO service_role;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_distributors_updated BEFORE UPDATE ON public.distributors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.my_distributor_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.distributors WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_seller_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.sellers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_discount_pct()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT l.discount_pct FROM public.distributors d
    JOIN public.level_settings l ON l.code = d.level_code
    WHERE d.user_id = auth.uid() LIMIT 1), 0);
$$;

CREATE POLICY "distributors own read" ON public.distributors FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR seller_id = public.my_seller_id());
CREATE POLICY "distributors own update" ON public.distributors FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "distributors admin insert" ON public.distributors FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "distributors admin delete" ON public.distributors FOR DELETE TO authenticated USING (public.is_admin());

-- CATALOGO BASE
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.brands TO service_role;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands read" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands admin" ON public.brands FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories read" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories admin" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.brands (name, slug, sort_order) VALUES
 ('Leatherman','leatherman',1),('Ledlenser','ledlenser',2),('Gerber','gerber',3),
 ('Olight','olight',4),('Coast','coast',5),('Fenix','fenix',6),
 ('GearWrench','gearwrench',7),('Nitecore','nitecore',8),('4Monster','4monster',9),
 ('Wooderful Life','wooderful-life',10);

INSERT INTO public.categories (name, slug, sort_order) VALUES
 ('Multiherramientas','multiherramientas',1),('Iluminación','iluminacion',2),
 ('Cuchillería','cuchilleria',3),('Herramienta','herramienta',4),
 ('Outdoor','outdoor',5),('Accesorios','accesorios',6);

-- PRODUCTOS
CREATE TYPE public.stock_status AS ENUM ('available','low','inquire','out');

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  list_price numeric(12,2) NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0,
  stock_status public.stock_status NOT NULL DEFAULT 'available',
  description text,
  features text[] NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_info text,
  main_image text,
  video_url text,
  is_new boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  times_quoted int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products read" ON public.products FOR SELECT TO authenticated USING (active OR public.is_admin());
CREATE POLICY "products admin" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_category ON public.products(category_id);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product images read" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "product images admin" ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROMOCIONES
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  title text,
  badge text NOT NULL DEFAULT 'OFERTA',
  promo_price numeric(12,2),
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos read" ON public.promotions FOR SELECT TO authenticated USING (active OR public.is_admin());
CREATE POLICY "promos admin" ON public.promotions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FAVORITOS
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (distributor_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites own" ON public.favorites FOR ALL TO authenticated
  USING (distributor_id = public.my_distributor_id() OR public.is_admin())
  WITH CHECK (distributor_id = public.my_distributor_id());

-- COTIZACIONES
CREATE TYPE public.quote_status AS ENUM ('draft','pending','in_review','approved','confirmed','rejected','cancelled');
CREATE TYPE public.order_status AS ENUM ('received','in_review','availability_confirmed','approved','preparing','shipped','delivered','rejected','cancelled');

CREATE SEQUENCE public.quote_number_seq;
CREATE SEQUENCE public.order_number_seq;

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('COT-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 4, '0')),
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'draft',
  level_code text,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  subtotal_list numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  comments text,
  internal_notes text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "quotes read" ON public.quotes FOR SELECT TO authenticated
  USING (distributor_id = public.my_distributor_id() OR public.is_admin() OR seller_id = public.my_seller_id());
CREATE POLICY "quotes insert own" ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (distributor_id = public.my_distributor_id() OR public.is_admin());
CREATE POLICY "quotes update" ON public.quotes FOR UPDATE TO authenticated
  USING (distributor_id = public.my_distributor_id() OR public.is_admin() OR seller_id = public.my_seller_id())
  WITH CHECK (distributor_id = public.my_distributor_id() OR public.is_admin() OR seller_id = public.my_seller_id());
CREATE POLICY "quotes delete own" ON public.quotes FOR DELETE TO authenticated
  USING (distributor_id = public.my_distributor_id() OR public.is_admin());

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  sku text NOT NULL,
  name text NOT NULL,
  list_price numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote items access" ON public.quote_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (q.distributor_id = public.my_distributor_id() OR public.is_admin() OR q.seller_id = public.my_seller_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (q.distributor_id = public.my_distributor_id() OR public.is_admin())));

-- PEDIDOS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE DEFAULT ('PED-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'received',
  total numeric(14,2) NOT NULL DEFAULT 0,
  inventory_applied boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated
  USING (distributor_id = public.my_distributor_id() OR public.is_admin() OR seller_id = public.my_seller_id());
CREATE POLICY "orders manage" ON public.orders FOR ALL TO authenticated
  USING (public.is_admin() OR seller_id = public.my_seller_id())
  WITH CHECK (public.is_admin() OR seller_id = public.my_seller_id());

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  sku text NOT NULL,
  name text NOT NULL,
  list_price numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items access" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.distributor_id = public.my_distributor_id() OR public.is_admin() OR o.seller_id = public.my_seller_id())))
  WITH CHECK (public.is_admin());

-- RECURSOS
CREATE TABLE public.resource_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.resource_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  thumbnail_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resource_categories TO service_role;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "res cat read" ON public.resource_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "res cat admin" ON public.resource_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "res read" ON public.resources FOR SELECT TO authenticated USING (active OR public.is_admin());
CREATE POLICY "res admin" ON public.resources FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICACIONES
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'app',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- SECCIONES DE CATALOGO
CREATE TABLE public.catalog_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  layout text NOT NULL DEFAULT 'grid',
  banner_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.catalog_sections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_sections TO service_role;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat sections read" ON public.catalog_sections FOR SELECT TO authenticated USING (active OR public.is_admin());
CREATE POLICY "cat sections admin" ON public.catalog_sections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cat items read" ON public.catalog_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat items admin" ON public.catalog_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BITACORA
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs admin read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "logs insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- VENDEDORES INICIALES
INSERT INTO public.sellers (name, email) VALUES ('Carlos','carlos@toho.com.mx'), ('Xime','xime@toho.com.mx');
