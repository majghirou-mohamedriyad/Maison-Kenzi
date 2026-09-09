-- Enums
CREATE TYPE public.parfum_gender AS ENUM ('Homme', 'Femme', 'Mixte');
CREATE TYPE public.order_status AS ENUM ('en_attente', 'confirmee', 'livree', 'annulee');
CREATE TYPE public.stock_status AS ENUM ('actif', 'rupture');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ PARFUMS ============
CREATE TABLE public.parfums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  maison text NOT NULL,
  gender public.parfum_gender NOT NULL,
  description text NOT NULL DEFAULT '',
  notes_tete text[] NOT NULL DEFAULT '{}',
  notes_coeur text[] NOT NULL DEFAULT '{}',
  notes_fond text[] NOT NULL DEFAULT '{}',
  price_5ml numeric(10,2) NOT NULL DEFAULT 0,
  price_10ml numeric(10,2) NOT NULL DEFAULT 0,
  price_20ml numeric(10,2) NOT NULL DEFAULT 0,
  image_label text NOT NULL DEFAULT '',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_new boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  stock_status public.stock_status NOT NULL DEFAULT 'actif',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parfums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parfums TO authenticated;
GRANT ALL ON public.parfums TO service_role;

ALTER TABLE public.parfums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read parfums"
  ON public.parfums FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert parfums"
  ON public.parfums FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update parfums"
  ON public.parfums FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete parfums"
  ON public.parfums FOR DELETE TO authenticated
  USING (true);

CREATE TRIGGER trg_parfums_updated_at
  BEFORE UPDATE ON public.parfums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ORDERS ============
CREATE SEQUENCE public.orders_seq START 1;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('NE-' || lpad(nextval('public.orders_seq')::text, 5, '0')),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  customer_address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'en_attente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.orders_seq TO anon, authenticated;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read orders"
  ON public.orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (true);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_status ON public.orders (status);

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  total_orders int NOT NULL DEFAULT 0,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- anon does NOT need direct access: customers are upserted by SECURITY DEFINER trigger
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read customers"
  ON public.customers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage customers"
  ON public.customers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Trigger: maintain customers from inserted orders (runs as definer = bypasses RLS)
CREATE OR REPLACE FUNCTION public.upsert_customer_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (email, name, phone, address, total_orders, total_spent)
  VALUES (NEW.customer_email, NEW.customer_name, NEW.customer_phone, NEW.customer_address, 1, NEW.total_amount)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, public.customers.phone),
    address = COALESCE(EXCLUDED.address, public.customers.address),
    total_orders = public.customers.total_orders + 1,
    total_spent = public.customers.total_spent + EXCLUDED.total_spent;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_orders_upsert_customer
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.upsert_customer_from_order();

-- ============ SEED ============
INSERT INTO public.parfums (name, maison, gender, description, notes_tete, notes_coeur, notes_fond, price_5ml, price_10ml, price_20ml, image_label, is_bestseller, is_new) VALUES
('Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Mixte', 'Un sillage iconique, à la fois floral, boisé et ambré. Une signature lumineuse et envoûtante.', ARRAY['Safran','Jasmin égyptien'], ARRAY['Bois d''ambre','Cèdre du Maroc'], ARRAY['Ambre gris','Musc blanc'], 150, 280, 500, 'baccarat-rouge-540', true, true),
('Aventus', 'Creed', 'Homme', 'Fruité, fumé et puissant. La fragrance des hommes de caractère.', ARRAY['Ananas','Bergamote','Cassis'], ARRAY['Rose','Bouleau','Patchouli'], ARRAY['Musc','Vanille','Mousse de chêne'], 140, 260, 470, 'aventus', true, false),
('Oud Wood', 'Tom Ford', 'Homme', 'Un oud raffiné, équilibré par le bois de santal et la vanille. Une élégance orientale moderne.', ARRAY['Bois de oud','Bois de rose','Cardamome'], ARRAY['Bois de santal','Vétiver'], ARRAY['Tonka','Ambre','Vanille'], 130, 240, 430, 'oud-wood', true, false),
('Black Orchid', 'Tom Ford', 'Femme', 'Mystérieux et sensuel, un floral noir aux accents de truffe et de chocolat.', ARRAY['Truffe','Bergamote','Cassis'], ARRAY['Orchidée noire','Fruit du dragon'], ARRAY['Patchouli','Vanille','Encens'], 110, 200, 360, 'black-orchid', false, false),
('Sauvage Elixir', 'Dior', 'Homme', 'Une concentration intense, épicée et boisée. Magnétique et indomptable.', ARRAY['Cannelle','Muscade','Cardamome','Lavande'], ARRAY['Réglisse','Pamplemousse'], ARRAY['Bois de santal','Patchouli','Ambre'], 120, 220, 400, 'sauvage-elixir', true, true),
('Libre', 'Yves Saint Laurent', 'Femme', 'Liberté florale. Lavande de France et fleur d''oranger du Maroc, sur un fond chaud et vibrant.', ARRAY['Mandarine','Cassis','Lavande'], ARRAY['Fleur d''oranger','Jasmin'], ARRAY['Musc','Ambre','Vanille'], 100, 180, 320, 'libre', false, false),
('Bleu de Chanel EDP', 'Chanel', 'Homme', 'Un boisé aromatique inattendu, libre et timeless. La signature du connaisseur.', ARRAY['Bergamote','Pamplemousse','Citron'], ARRAY['Gingembre','Muscade','Iris'], ARRAY['Cèdre','Bois de santal','Encens'], 125, 230, 420, 'bleu-de-chanel', true, false),
('La Vie Est Belle', 'Lancôme', 'Femme', 'Une déclaration de bonheur. Iris poudré et gourmandise praliné-vanille.', ARRAY['Cassis','Poire'], ARRAY['Iris','Jasmin','Fleur d''oranger'], ARRAY['Praline','Vanille','Patchouli'], 90, 165, 295, 'la-vie-est-belle', false, false),
('Eros', 'Versace', 'Homme', 'Frais, intense et passionné. Menthe glaciale, vanille et bois précieux.', ARRAY['Menthe','Citron','Pomme verte'], ARRAY['Tonka','Géranium','Ambroxan'], ARRAY['Vanille','Cèdre','Vétiver'], 80, 150, 270, 'eros', false, true);
