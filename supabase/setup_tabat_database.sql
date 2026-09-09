-- ==========================================================
-- SCRIPT COMPLET D'INITIALISATION DE LA BASE DE DONNÉES TABAT
-- À exécuter dans Supabase -> SQL Editor
-- ==========================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE parfum_gender AS ENUM ('Homme', 'Femme', 'Mixte');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('actif', 'rupture');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('en_attente', 'confirmee', 'livree', 'annulee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- Table: parfums
CREATE TABLE IF NOT EXISTS public.parfums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    maison TEXT NOT NULL,
    gender parfum_gender NOT NULL DEFAULT 'Homme',
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
    stock_status stock_status NOT NULL DEFAULT 'actif',
    sale_mode TEXT NOT NULL DEFAULT 'decant',
    full_bottle_volume_ml NUMERIC,
    full_bottle_price NUMERIC,
    full_bottle_stock NUMERIC DEFAULT 10,
    full_bottle_limited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BOOLEAN PRIMARY KEY DEFAULT true,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'Nous améliorons votre expérience. Revenez très bientôt.',
    instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/tabatperfume',
    whatsapp_phone TEXT NOT NULL DEFAULT '212600000000',
    bot_enabled BOOLEAN NOT NULL DEFAULT true,
    bot_name TEXT NOT NULL DEFAULT 'Assistante TABAT',
    bot_welcome TEXT NOT NULL DEFAULT 'Bonjour 👋 Bienvenue chez TABAT. Comment puis-je vous aider aujourd''hui ?',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = true)
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status order_status NOT NULL DEFAULT 'en_attente',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: flaconnage
CREATE TABLE IF NOT EXISTS public.flaconnage (
    size TEXT PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0,
    low_threshold INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: bot_qa
CREATE TABLE IF NOT EXISTS public.bot_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE public.parfums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flaconnage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_qa ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter toute erreur de ré-exécution
DROP POLICY IF EXISTS "Public parfums select" ON public.parfums;
DROP POLICY IF EXISTS "Public settings select" ON public.app_settings;
DROP POLICY IF EXISTS "Public bot_qa select" ON public.bot_qa;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert customers" ON public.customers;

DROP POLICY IF EXISTS "Admin full parfums" ON public.parfums;
DROP POLICY IF EXISTS "Admin full settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin full orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full customers" ON public.customers;
DROP POLICY IF EXISTS "Admin full expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin full flaconnage" ON public.flaconnage;
DROP POLICY IF EXISTS "Admin full bot_qa" ON public.bot_qa;

-- Lecture publique pour le catalogue et paramètres
CREATE POLICY "Public parfums select" ON public.parfums FOR SELECT USING (true);
CREATE POLICY "Public settings select" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public bot_qa select" ON public.bot_qa FOR SELECT USING (true);

-- Insertion publique des commandes
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert customers" ON public.customers FOR INSERT WITH CHECK (true);

-- Acces total pour les administrateurs
CREATE POLICY "Admin full parfums" ON public.parfums FOR ALL USING (true);
CREATE POLICY "Admin full settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Admin full orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin full customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Admin full expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Admin full flaconnage" ON public.flaconnage FOR ALL USING (true);
CREATE POLICY "Admin full bot_qa" ON public.bot_qa FOR ALL USING (true);

-- 4. INSERTION DES DONNÉES INITIALES (SEED TABAT)

INSERT INTO public.app_settings (id, maintenance_mode, maintenance_message, instagram_url, whatsapp_phone, bot_enabled, bot_name, bot_welcome)
VALUES (true, false, 'Nous améliorons votre expérience. Revenez très bientôt.', 'https://instagram.com/tabatperfume', '212600000000', true, 'Assistante TABAT', 'Bonjour 👋 Bienvenue chez TABAT. Comment puis-je vous aider aujourd''hui ?')
ON CONFLICT (id) DO UPDATE SET 
    bot_name = EXCLUDED.bot_name,
    bot_welcome = EXCLUDED.bot_welcome,
    updated_at = NOW();

INSERT INTO public.flaconnage (size, stock, low_threshold) VALUES
('5ml', 100, 15),
('10ml', 100, 15),
('20ml', 50, 10)
ON CONFLICT (size) DO NOTHING;

INSERT INTO public.parfums (id, name, maison, gender, category, description, notes_tete, notes_coeur, notes_fond, price_5ml, price_10ml, price_20ml, image_label, image_url, is_bestseller, is_new, sale_mode, full_bottle_price) VALUES
-- Homme
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

-- Femme
('valentino-born-in-roma-intense', 'Born In Roma Intense', 'Valentino', 'Femme', 'femme', 'Une vanille ambrée envoûtante rehaussée de jasmin grandiflorum et de benjoin chaud.', ARRAY['Bourbon Vanille', 'Bergamote'], ARRAY['Jasmin Grandiflorum'], ARRAY['Résine de benjoin'], 80, 150, 280, 'valentino-born-in-roma-intense', '/products/oPhAX4CfNfBODXgnEi2dk0ncqbCt0nv6UIEyrRtt.png', true, false, 'decant', NULL),
('burberry-her-eau-de-parfum', 'Burberry Her EDP', 'Burberry', 'Femme', 'femme', 'Un souffle d''esprit londonien. Un cocktail gourmand de fruits rouges et de musc boisé blanc.', ARRAY['Fraise', 'Framboise', 'Mûre', 'Myrtille'], ARRAY['Jasmin', 'Violette'], ARRAY['Musc clair', 'Ambre sec'], 155, 290, 520, 'burberry-her-eau-de-parfum', '/products/zsIexhDU7OItE3gqv8qdjsYcT4WkUSsugkVtif4T.png', true, false, 'decant', NULL),
('prada-paradox-eau-de-parfum', 'Prada Paradoxe EDP', 'Prada', 'Femme', 'femme', 'L''expression d''une féminité réinventée. Fleur d''oranger, néroli et ambre bio-converti.', ARRAY['Poire', 'Tangerine', 'Bergamote'], ARRAY['Fleur d''oranger', 'Néroli', 'Jasmin Sambac'], ARRAY['Ambrofix', 'Vanille de Madagascar', 'Musc blanc'], 160, 300, 540, 'prada-paradox-eau-de-parfum', '/products/ek2cRWdHCDiORBnvXIMnPjGjYXhSjRmUVKriHoqG.png', true, true, 'decant', NULL),
('baccarat-rouge-540', 'Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Mixte', 'femme', 'Un sillage iconique, à la fois floral, boisé et ambré. Une signature lumineuse et envoûtante.', ARRAY['Safran', 'Jasmin égyptien'], ARRAY['Bois d''ambre', 'Cèdre du Maroc'], ARRAY['Ambre gris', 'Musc blanc'], 150, 280, 500, 'baccarat-rouge-540', '/products/7GOrfCZmdExm4XUeu8mW4gUABrgg8BC8XXGwdRzs_md.png', true, false, 'decant', NULL),
('libre', 'Libre', 'Yves Saint Laurent', 'Femme', 'femme', 'Liberté florale. Lavande de France et fleur d''oranger du Maroc, sur un fond chaud et vibrant.', ARRAY['Mandarine', 'Cassis', 'Lavande'], ARRAY['Fleur d''oranger', 'Jasmin'], ARRAY['Musc', 'Ambre', 'Vanille'], 100, 180, 320, 'libre', '/products/FbuJnNrgUtZuPAEYwb1GcBtRSrkEzOhmUUI1tpqJ_md.png', false, false, 'decant', NULL),

-- Déodorants Stick
('old-spice-captain', 'Old Spice Captain', 'Old Spice', 'Homme', 'deodorants-stick', 'Stick déodorant 50ml aux notes marines et de bois de santal. Protection longue durée 48h sans aluminium.', ARRAY['Accord marin', 'Bergamote'], ARRAY['Bois de santal'], ARRAY['Musc propre'], 90, 90, 90, 'old-spice-captain', '/products/Fx8tNMKaxqKKF7blfSEdZV9yFZA6Qhx4vzzIBoBz.png', true, false, 'full_bottle', 90),
('old-spice-wolfthorn', 'Old Spice Wolfthorn', 'Old Spice', 'Homme', 'deodorants-stick', 'Stick déodorant parfum exotique et fruité d''agrumes sauvages. Senteur irrésistible.', ARRAY['Agrumes sauvages', 'Orange douce'], ARRAY['Fruits tropicaux'], ARRAY['Bois doux'], 90, 90, 90, 'old-spice-wolfthorn', '/products/qApRwYtTj5TwAPUZ2BkR4NGvxt9bpEpiEHNVmkfQ.png', true, false, 'full_bottle', 90),

-- LES PACKS
('pack-burberry-her-light-blue', 'PACK Burberry Her EDP + Light Blue EDT', 'TABAT Selection', 'Femme', 'packs', 'Pack Duo Féminin Premium : 5 ml Burberry Her EDP + 10 ml Dolce & Gabbana Light Blue EDT.', ARRAY['Fraise', 'Framboise', 'Citron de Sicile'], ARRAY['Jasmin', 'Pomme verte'], ARRAY['Musc clair', 'Bois de cèdre'], 230, 230, 230, 'pack-burberry-light-blue', '/products/t933E5qWZLhJ6tw7f9qDAbK9VsRYaCmnwzfv7jE0.jpg', true, false, 'full_bottle', 230),
('pack-burberry-light-blue-prada', 'PACK Burberry Her + Light Blue + Prada Paradoxe', 'TABAT Selection', 'Femme', 'packs', 'Trio d''exception Femme : 5 ml Burberry Her EDP + 10 ml Light Blue EDT + 5 ml Prada Paradoxe EDP.', ARRAY['Fraise', 'Poire', 'Citron'], ARRAY['Fleur d''oranger', 'Néroli', 'Jasmin'], ARRAY['Vanille', 'Musc', 'Ambre'], 310, 310, 310, 'pack-trio-femme', '/products/bIseawOmna79Wb2X8jjnouMa3GEvitFQzzjwxoyJ.jpg', true, true, 'full_bottle', 310),
('pack-paradise-le-beau-hawas', 'PACK Paradise Garden + Le Beau + Hawas Kobra', 'TABAT Selection', 'Homme', 'packs', 'Le Pack Séduction Homme : JPG Paradise Garden (5ml) + JPG Le Beau Le Parfum (5ml) + Rasasi Hawas Kobra (10ml).', ARRAY['Menthe aquatique', 'Noix de coco', 'Citron vert'], ARRAY['Figue', 'Ananas', 'Cardamome'], ARRAY['Bois de santal', 'Tonka', 'Ambre'], 235, 235, 235, 'pack-trio-homme', '/products/AKpX92WYjIapasgoJ9il1VlBuVCS42s1gMLPJD5W.png', true, false, 'full_bottle', 235),
('pack-french-tobacco-y-deodorant', 'PACK French Tobacco + Y EDP + Deodorant Old Spice', 'TABAT Selection', 'Homme', 'packs', 'Coffret Gentleman : French Tobacco Ibrahim AlQurashi (5ml) + YSL Y EDP (5ml) + Déodorant Stick Old Spice Captain.', ARRAY['Tabac blond', 'Bergamote', 'Accord marin'], ARRAY['Gingembre', 'Sauge', 'Épices chaudes'], ARRAY['Bois de cèdre', 'Vanille', 'Bois de santal'], 270, 270, 270, 'pack-gentleman-tobacco', '/products/QK2r4LMFudTtIZpyHQJQZaalppxhZthE0MXFf90H.png', true, true, 'full_bottle', 270)
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

INSERT INTO public.bot_qa (question, answer, is_active, sort_order) VALUES
('🚚 Quels sont vos délais de livraison au Maroc ?', 'La livraison est rapide et express partout au Maroc sous 24h à 48h. Le paiement s''effectue en espèces à la livraison.', true, 1),
('✨ Vos parfums sont-ils 100% authentiques ?', 'Garantie 100% Authenticité. Tous nos jus sont prélevés directement des flacons officiels scellés des plus grandes maisons de parfumerie.', true, 2),
('📏 Comment choisir le format (5ml, 10ml, 20ml) ?', '• 5ml (~75 sprays) : Parfait pour tester et voyager.\n• 10ml (~150 sprays) : 3 à 4 semaines d''utilisation quotidienne.\n• 20ml (~300 sprays) : Format économique pour vos parfums favoris.', true, 3),
('🔥 Quels sont les Best-Sellers du moment ?', 'Pour Homme : Jean Paul Gaultier Le Beau, YSL Y EDP & Afnan 9PM.\nPour Femme : Valentino Born In Roma Intense, Prada Paradoxe & Baccarat Rouge 540.', true, 4),
('💵 Quel est le mode de paiement ?', 'Paiement à la livraison (Cash on Delivery). Vous ne payez qu''à la réception de votre colis auprès du livreur.', true, 5),
('🎁 Avez-vous des packs découverte ?', 'Oui ! Découvrez nos Packs Découverte dans l''onglet Collection Packs avec des tarifs avantageux et des combinaisons exclusives.', true, 6);

