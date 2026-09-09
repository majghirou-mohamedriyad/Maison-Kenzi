-- ====================================================================
-- SCRIPT COMPLET D'INITIALISATION DU SCHÉMA MAISONKENZI (POSTGRESQL)
-- À exécuter dans Supabase -> SQL Editor (sur votre VPS)
-- ====================================================================

-- 1. CRÉATION DU SCHÉMA DÉDIÉ MAISONKENZI
CREATE SCHEMA IF NOT EXISTS maisonkenzi;

-- 2. EXTENSIONS & TYPES DANS LE SCHÉMA MAISONKENZI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE maisonkenzi.parfum_gender AS ENUM ('Homme', 'Femme', 'Mixte');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maisonkenzi.stock_status AS ENUM ('actif', 'rupture');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maisonkenzi.order_status AS ENUM ('en_attente', 'confirmee', 'livree', 'annulee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES DANS LE SCHÉMA MAISONKENZI

-- Table: parfums (Haute Parfumerie de Niche & Décants)
CREATE TABLE IF NOT EXISTS maisonkenzi.parfums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    maison TEXT NOT NULL,
    gender maisonkenzi.parfum_gender NOT NULL DEFAULT 'Homme',
    category TEXT,
    description TEXT,
    notes_tete TEXT[] DEFAULT '{}',
    notes_coeur TEXT[] DEFAULT '{}',
    notes_fond TEXT[] DEFAULT '{}',
    price_5ml NUMERIC NOT NULL DEFAULT 0,
    price_10ml NUMERIC NOT NULL DEFAULT 0,
    price_20ml NUMERIC NOT NULL DEFAULT 0,
    image_label TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    stock_status maisonkenzi.stock_status NOT NULL DEFAULT 'actif',
    sale_mode TEXT NOT NULL DEFAULT 'decant',
    full_bottle_volume_ml NUMERIC,
    full_bottle_price NUMERIC,
    full_bottle_stock NUMERIC DEFAULT 10,
    full_bottle_limited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: app_settings (Configuration de la Maison)
CREATE TABLE IF NOT EXISTS maisonkenzi.app_settings (
    id BOOLEAN PRIMARY KEY DEFAULT true,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'Maison Kenzi prépare de nouvelles créations. Revenez très bientôt.',
    instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/maisonkenzi',
    whatsapp_phone TEXT NOT NULL DEFAULT '212752850156',
    bot_enabled BOOLEAN NOT NULL DEFAULT true,
    bot_name TEXT NOT NULL DEFAULT 'Conseillère Maison Kenzi',
    bot_welcome TEXT NOT NULL DEFAULT 'Bienvenue chez Maison Kenzi. Comment puis-je vous guider dans votre découverte olfactive ?',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = true)
);

-- Table: orders (Commandes Clients)
CREATE TABLE IF NOT EXISTS maisonkenzi.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status maisonkenzi.order_status NOT NULL DEFAULT 'en_attente',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: customers (Fichier Clients)
CREATE TABLE IF NOT EXISTS maisonkenzi.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: expenses (Gestion des Frais)
CREATE TABLE IF NOT EXISTS maisonkenzi.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: flaconnage (Stocks Flacons & Décants)
CREATE TABLE IF NOT EXISTS maisonkenzi.flaconnage (
    size TEXT PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0,
    low_threshold INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: bot_qa (Questions / Réponses Bot)
CREATE TABLE IF NOT EXISTS maisonkenzi.bot_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DROITS D'ACCÈS & PERMISSIONS POSTGREST POUR SUPABASE
GRANT USAGE ON SCHEMA maisonkenzi TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA maisonkenzi TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA maisonkenzi TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA maisonkenzi TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA maisonkenzi GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA maisonkenzi GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA maisonkenzi GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 5. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE maisonkenzi.parfums ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.flaconnage ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.bot_qa ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Public parfums select" ON maisonkenzi.parfums FOR SELECT USING (true);
CREATE POLICY "Public settings select" ON maisonkenzi.app_settings FOR SELECT USING (true);
CREATE POLICY "Public bot_qa select" ON maisonkenzi.bot_qa FOR SELECT USING (true);

-- Insertion publique des commandes et clients
CREATE POLICY "Public insert orders" ON maisonkenzi.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert customers" ON maisonkenzi.customers FOR INSERT WITH CHECK (true);

-- Accès complet administrateur
CREATE POLICY "Admin full parfums" ON maisonkenzi.parfums FOR ALL USING (true);
CREATE POLICY "Admin full settings" ON maisonkenzi.app_settings FOR ALL USING (true);
CREATE POLICY "Admin full orders" ON maisonkenzi.orders FOR ALL USING (true);
CREATE POLICY "Admin full customers" ON maisonkenzi.customers FOR ALL USING (true);
CREATE POLICY "Admin full expenses" ON maisonkenzi.expenses FOR ALL USING (true);
CREATE POLICY "Admin full flaconnage" ON maisonkenzi.flaconnage FOR ALL USING (true);
CREATE POLICY "Admin full bot_qa" ON maisonkenzi.bot_qa FOR ALL USING (true);

-- 6. DONNÉES INITIALES (SEED MAISON KENZI — PARFUMS DE NICHE)

INSERT INTO maisonkenzi.app_settings (id, maintenance_mode, maintenance_message, instagram_url, whatsapp_phone, bot_enabled, bot_name, bot_welcome)
VALUES (true, false, 'Maison Kenzi prépare de nouvelles fragrances d''exception. Revenez très bientôt.', 'https://instagram.com/maisonkenzi', '212752850156', true, 'Conseillère Maison Kenzi', 'Bienvenue chez Maison Kenzi. Comment puis-je vous orienter parmi nos créations de niche ?')
ON CONFLICT (id) DO UPDATE SET 
    bot_name = EXCLUDED.bot_name,
    bot_welcome = EXCLUDED.bot_welcome,
    updated_at = NOW();

INSERT INTO maisonkenzi.flaconnage (size, stock, low_threshold) VALUES
('5ml', 150, 20),
('10ml', 150, 20),
('20ml', 80, 15)
ON CONFLICT (size) DO NOTHING;

INSERT INTO maisonkenzi.parfums (id, name, maison, gender, category, description, notes_tete, notes_coeur, notes_fond, price_5ml, price_10ml, price_20ml, image_label, image_url, is_bestseller, is_new, sale_mode, full_bottle_price) VALUES
-- Homme Niche
('9-pm-night-out-afnan', '9PM Night Out', 'Afnan', 'Homme', 'homme', 'Une fragrance séduisante, gourmande et épicée. Parfaite pour les sorties nocturnes et les moments intenses.', ARRAY['Pomme', 'Cannelle', 'Lavande sauvage'], ARRAY['Fleur d''oranger', 'Muguet'], ARRAY['Vanille', 'Tonka', 'Bois de santal', 'Ambre'], 60, 110, 200, '9-pm-night-out', '/products/hLm3qnvGyzLrmFfuKkLEO7hUwHHUAlrnM8Oh2Im4.png', true, true, 'decant', NULL),
('le-beau-le-parfum', 'Le Beau Le Parfum', 'Jean Paul Gaultier', 'Homme', 'homme', 'Un sillage boisé ambré ultra sensuel mêlant la noix de coco au bois de santal intense.', ARRAY['Noix de coco', 'Ananas', 'Iris'], ARRAY['Bois de santal', 'Tonka'], ARRAY['Ambre gris', 'Bois de cyprès'], 80, 150, 280, 'le-beau-le-parfum', '/products/t8gFCjNoV8DRaroBVuFFbtPg17NetnyLGnSdOERX.png', true, false, 'decant', NULL),
('stronger-with-you-intensely', 'Stronger With You Intensely', 'Emporio Armani', 'Homme', 'homme', 'Un parfum ambré boisé aux accents de marron glacé et de vanille chaude. Irrésistible.', ARRAY['Poivre rose', 'Genévrier'], ARRAY['Lavande', 'Sauge', 'Cannelle', 'Marron glacé'], ARRAY['Vanille', 'Tonka', 'Ambre'], 130, 240, 420, 'stronger-with-you-intensely', '/products/nEbcktSg3wbRtyI1wo3pFSPlL74Nqazzo482E3ca.png', true, false, 'decant', NULL),
('y-eau-de-parfum-yves-saint-laurent', 'Y Eau de Parfum', 'Yves Saint Laurent', 'Homme', 'homme', 'Un fougère boisé intense. La fraîcheur de la bergamote alliée à la puissance de la sauge.', ARRAY['Bergamote', 'Gingembre', 'Pomme'], ARRAY['Sauge', 'Géranium', 'Genièvre'], ARRAY['Bois de cèdre', 'Tonka', 'Vétiver'], 80, 150, 280, 'y-eau-de-parfum', '/products/IpNXY2NEr5voPefRDYPrd6yZpVkd2h30WRfNjdQo.png', true, false, 'decant', NULL),
('hawas-kobra', 'Hawas Kobra', 'Rasasi', 'Homme', 'homme', 'La force sauvage et aquatique du serpent Kobra. Énergique, frais et longue tenue.', ARRAY['Citron', 'Pomme verte', 'Cannelle'], ARRAY['Fleur d''oranger', 'Cardamome'], ARRAY['Bois de santal', 'Ambre gris', 'Musc'], 90, 170, 310, 'hawas-kobra', '/products/h08POnfY83TpRqVUV6KkjzSGbXFzzpXlsNYHmJOc.png', true, true, 'decant', NULL),
('le-beau-paradise-garden', 'Le Beau Paradise Garden', 'Jean Paul Gaultier', 'Homme', 'homme', 'Une fraîcheur aquatique tropicale et boisée. L''éclat de la menthe et du figuier sauvage.', ARRAY['Menthe aquatique', 'Figue'], ARRAY['Noix de coco', 'Nénuphar'], ARRAY['Bois de santal', 'Tonka'], 80, 150, 280, 'le-beau-paradise-garden', '/products/grLK6sKjcSIZYtwtMQ8Qp3c1AJo5PfGhefsCDHTl.png', false, true, 'decant', NULL),
('turathi-electric-afnan', 'Turathi Electric', 'Afnan', 'Homme', 'homme', 'Un sillage électrique d''agrumes vibrants et de bois précieux.', ARRAY['Bergamote', 'Citron vert'], ARRAY['Gingembre', 'Epices'], ARRAY['Ambre', 'Bois de cèdre'], 90, 170, 310, 'turathi-electric', '/products/LGLaFlIoT6ssdjl7rIdAmXh5zbq1gPuYZ6IsVWQf.png', false, true, 'decant', NULL),
('rare-reef-afnan', 'Rare Reef', 'Afnan', 'Homme', 'homme', 'Fraîcheur récifale aquatique et notes marines cristallines.', ARRAY['Notes marines', 'Agrumes'], ARRAY['Fleur d''eau'], ARRAY['Musc clair'], 80, 150, 270, 'rare-reef', '/products/RGjtP7DTti3p57IYVLOKkJoXJO9CXtUDZlhOimPS.png', false, true, 'decant', NULL),
('9-pm-rebel-afnan', '9 PM Rebel', 'Afnan', 'Homme', 'homme', 'Le caractère rebelle et audacieux de la nuit.', ARRAY['Ananas', 'Mandarine'], ARRAY['Bois de cèdre'], ARRAY['Vanille', 'Ambre'], 80, 150, 270, '9-pm-rebel', '/products/E5e80oBq2hZLreG7Q9jwt0T2WYPnXyXnR0GOMESY.png', true, false, 'decant', NULL),
('french-tobacco-ibrahim-alqurashi', 'French Tobacco', 'Ibrahim AlQurashi', 'Homme', 'homme', 'Tabac français d''exception rehaussé de notes ambrées royales.', ARRAY['Tabac blond'], ARRAY['Épices d''orient'], ARRAY['Ambre royal', 'Vanille'], 80, 150, 280, 'french-tobacco', '/products/53ZawTyPIXhYtlik20lqOClVieOQLmJl2kzFfwbC.png', true, false, 'decant', NULL),
('hawas-for-him', 'Hawas For Him', 'Rasasi', 'Homme', 'homme', 'L''iconique Hawas For Him. Aquatique, fruité et épicé.', ARRAY['Pomme', 'Bergamote', 'Cannelle'], ARRAY['Fleur d''oranger', 'Cardamome'], ARRAY['Bois de santal', 'Ambre gris'], 80, 150, 280, 'hawas-for-him', '/products/xH7QOSeoLBWwVQGwDwmmmv0VkP3cwXlk3ciXqbK2.png', true, false, 'decant', NULL),
('aventus', 'Aventus', 'Creed', 'Homme', 'homme', 'Fruité, fumé et puissant. La fragrance mythique des hommes de caractère.', ARRAY['Ananas', 'Bergamote', 'Cassis'], ARRAY['Rose', 'Bouleau', 'Patchouli'], ARRAY['Musc', 'Vanille', 'Mousse de chêne'], 140, 260, 470, 'aventus', '/products/A6mqFU015iOtcKyxg4H2EwEqFNEtkiYTEcw88eTg_md.png', true, false, 'decant', NULL),
('sauvage-elixir', 'Sauvage Elixir', 'Dior', 'Homme', 'homme', 'Une concentration intense, épicée et boisée. Magnétique et indomptable.', ARRAY['Cannelle', 'Muscade', 'Cardamome', 'Lavande'], ARRAY['Réglisse', 'Pamplemousse'], ARRAY['Bois de santal', 'Patchouli', 'Ambre'], 120, 220, 400, 'sauvage-elixir', '/products/VsKsUcoTbdd2UovRRIwaL16qItoaLxokjpacW9M6_md.png', true, false, 'decant', NULL),

-- Femme & Unisexe Niche
('valentino-born-in-roma-intense', 'Born In Roma Intense', 'Valentino', 'Femme', 'femme', 'Une vanille ambrée envoûtante rehaussée de jasmin grandiflorum et de benjoin chaud.', ARRAY['Bourbon Vanille', 'Bergamote'], ARRAY['Jasmin Grandiflorum'], ARRAY['Résine de benjoin'], 80, 150, 280, 'valentino-born-in-roma-intense', '/products/oPhAX4CfNfBODXgnEi2dk0ncqbCt0nv6UIEyrRtt.png', true, false, 'decant', NULL),
('burberry-her-eau-de-parfum', 'Burberry Her EDP', 'Burberry', 'Femme', 'femme', 'Un souffle d''esprit londonien. Un cocktail gourmand de fruits rouges et de musc boisé blanc.', ARRAY['Fraise', 'Framboise', 'Mûre', 'Myrtille'], ARRAY['Jasmin', 'Violette'], ARRAY['Musc clair', 'Ambre sec'], 155, 290, 520, 'burberry-her-eau-de-parfum', '/products/zsIexhDU7OItE3gqv8qdjsYcT4WkUSsugkVtif4T.png', true, false, 'decant', NULL),
('prada-paradox-eau-de-parfum', 'Prada Paradoxe EDP', 'Prada', 'Femme', 'femme', 'L''expression d''une féminité réinventée. Fleur d''oranger, néroli et ambre bio-converti.', ARRAY['Poire', 'Tangerine', 'Bergamote'], ARRAY['Fleur d''oranger', 'Néroli', 'Jasmin Sambac'], ARRAY['Ambrofix', 'Vanille de Madagascar', 'Musc blanc'], 160, 300, 540, 'prada-paradox-eau-de-parfum', '/products/ek2cRWdHCDiORBnvXIMnPjGjYXhSjRmUVKriHoqG.png', true, true, 'decant', NULL),
('baccarat-rouge-540', 'Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Mixte', 'femme', 'Un sillage iconique, à la fois floral, boisé et ambré. Une signature lumineuse et envoûtante.', ARRAY['Safran', 'Jasmin égyptien'], ARRAY['Bois d''ambre', 'Cèdre du Maroc'], ARRAY['Ambre gris', 'Musc blanc'], 150, 280, 500, 'baccarat-rouge-540', '/products/7GOrfCZmdExm4XUeu8mW4gUABrgg8BC8XXGwdRzs_md.png', true, false, 'decant', NULL),
('libre', 'Libre', 'Yves Saint Laurent', 'Femme', 'femme', 'Liberté florale. Lavande de France et fleur d''oranger du Maroc, sur un fond chaud et vibrant.', ARRAY['Mandarine', 'Cassis', 'Lavande'], ARRAY['Fleur d''oranger', 'Jasmin'], ARRAY['Musc', 'Ambre', 'Vanille'], 100, 180, 320, 'libre', '/products/FbuJnNrgUtZuPAEYwb1GcBtRSrkEzOhmUUI1tpqJ_md.png', false, false, 'decant', NULL)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price_5ml = EXCLUDED.price_5ml,
    price_10ml = EXCLUDED.price_10ml,
    price_20ml = EXCLUDED.price_20ml,
    full_bottle_price = EXCLUDED.full_bottle_price,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- Bot Q&A
INSERT INTO maisonkenzi.bot_qa (question, answer, is_active, sort_order) VALUES
('Quels sont vos delais de livraison au Maroc ?', 'La livraison est assuree partout au Maroc sous 24h a 48h. Le reglement s''effectue a la reception.', true, 1),
('Vos parfums de niche sont-ils 100% authentiques ?', 'Garantie d''authenticite absolue. Tous nos jus sont directement preleves de flacons officiels scelles de grandes maisons de niche.', true, 2),
('Comment choisir le format nomade (5ml, 10ml, 20ml) ?', '5ml (~75 pulverisations) pour decouvrir, 10ml (~150 pulverisations) pour plusieurs semaines, 20ml (~300 pulverisations) pour un usage quotidien.', true, 3),
('Quelles sont vos plus prestigieuses fragrances ?', 'Creed Aventus, Baccarat Rouge 540 de Maison Francis Kurkdjian, Sauvage Elixir et French Tobacco d''Ibrahim AlQurashi.', true, 4),
('Quel est le mode de paiement ?', 'Paiement a la livraison en especes lors de la remise de votre colis par le livreur.', true, 5)
ON CONFLICT DO NOTHING;
