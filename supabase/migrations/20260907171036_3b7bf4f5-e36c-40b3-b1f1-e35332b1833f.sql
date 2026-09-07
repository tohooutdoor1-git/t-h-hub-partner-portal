-- 1. Nuevo rol
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Funciones de rol/permiso (comparación por texto para no usar el valor nuevo en esta transacción)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','super_admin'));
$$;

-- 3. Permisos administrativos
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read permissions" ON public.admin_permissions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "super admin manages permissions" ON public.admin_permissions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_user_id)
     OR EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND permission = _permission);
$$;

-- 4. Invitaciones
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'distributor',
  full_name text,
  company text,
  level_code text,
  seller_id uuid,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  user_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage invitations" ON public.invitations FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 5. Historial de actividad ampliado
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS changes jsonb;
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON public.activity_logs (created_at DESC);

-- 6. Colecciones y etiquetas
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read collections" ON public.collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage collections" ON public.collections FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.collection_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (collection_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_products TO authenticated;
GRANT ALL ON public.collection_products TO service_role;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read collection products" ON public.collection_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage collection products" ON public.collection_products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage tags" ON public.tags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (product_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_tags TO authenticated;
GRANT ALL ON public.product_tags TO service_role;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read product tags" ON public.product_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage product tags" ON public.product_tags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 7. Especificaciones configurables por categoría
CREATE TABLE IF NOT EXISTS public.category_spec_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  unit text,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_spec_fields TO authenticated;
GRANT ALL ON public.category_spec_fields TO service_role;
ALTER TABLE public.category_spec_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read spec fields" ON public.category_spec_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage spec fields" ON public.category_spec_fields FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 8. Columnas nuevas
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock integer NOT NULL DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price numeric;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);