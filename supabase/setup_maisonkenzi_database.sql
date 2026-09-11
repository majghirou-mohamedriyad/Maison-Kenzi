-- ====================================================================
-- SCRIPT COMPLET D'INITIALISATION DU SCHÉMA MAISONKENZI (POSTGRESQL)
-- Schéma vierge prêt pour administration via le tableau de bord
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

-- Table: categories (Univers et Catégories de Parfums)
CREATE TABLE IF NOT EXISTS maisonkenzi.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: parfums (Haute Parfumerie de Niche & Décants)
CREATE TABLE IF NOT EXISTS maisonkenzi.parfums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    maison TEXT NOT NULL,
    gender maisonkenzi.parfum_gender NOT NULL DEFAULT 'Homme',
    category TEXT,
    categories TEXT[] DEFAULT '{}',
    seasons TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    description TEXT,
    notes_tete TEXT[] DEFAULT '{}',
    notes_coeur TEXT[] DEFAULT '{}',
    notes_fond TEXT[] DEFAULT '{}',
    price_5ml NUMERIC NOT NULL DEFAULT 0,
    price_10ml NUMERIC NOT NULL DEFAULT 0,
    price_20ml NUMERIC NOT NULL DEFAULT 0,
    image_label TEXT NOT NULL DEFAULT '',
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

-- Assurer la présence des colonnes images, seasons & categories pour les bases existantes
ALTER TABLE maisonkenzi.parfums ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE maisonkenzi.parfums ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}';
ALTER TABLE maisonkenzi.parfums ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

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
ALTER TABLE maisonkenzi.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.parfums ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.flaconnage ENABLE ROW LEVEL SECURITY;
ALTER TABLE maisonkenzi.bot_qa ENABLE ROW LEVEL SECURITY;

-- Lecture publique (Site Client & Suivi de Commande)
CREATE POLICY "Public categories select" ON maisonkenzi.categories FOR SELECT USING (true);
CREATE POLICY "Public parfums select" ON maisonkenzi.parfums FOR SELECT USING (true);
CREATE POLICY "Public settings select" ON maisonkenzi.app_settings FOR SELECT USING (true);
CREATE POLICY "Public bot_qa select" ON maisonkenzi.bot_qa FOR SELECT USING (true);
CREATE POLICY "Public orders select" ON maisonkenzi.orders FOR SELECT USING (true);

-- Insertion publique des commandes et clients (Tunnel de Vente)
CREATE POLICY "Public insert orders" ON maisonkenzi.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert customers" ON maisonkenzi.customers FOR INSERT WITH CHECK (true);

-- Accès complet administrateur (Tableau de Bord /admin)
CREATE POLICY "Admin full categories" ON maisonkenzi.categories FOR ALL USING (true);
CREATE POLICY "Admin full parfums" ON maisonkenzi.parfums FOR ALL USING (true);
CREATE POLICY "Admin full settings" ON maisonkenzi.app_settings FOR ALL USING (true);
CREATE POLICY "Admin full orders" ON maisonkenzi.orders FOR ALL USING (true);
CREATE POLICY "Admin full customers" ON maisonkenzi.customers FOR ALL USING (true);
CREATE POLICY "Admin full expenses" ON maisonkenzi.expenses FOR ALL USING (true);
CREATE POLICY "Admin full flaconnage" ON maisonkenzi.flaconnage FOR ALL USING (true);
CREATE POLICY "Admin full bot_qa" ON maisonkenzi.bot_qa FOR ALL USING (true);

-- 6. CONFIGURATION DU STOCKAGE SUPABASE (STORAGE BUCKET 'product-images')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public storage access" ON storage.objects;
    CREATE POLICY "Public storage access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public storage insert" ON storage.objects;
    CREATE POLICY "Public storage insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public storage update" ON storage.objects;
    CREATE POLICY "Public storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public storage delete" ON storage.objects;
    CREATE POLICY "Public storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. CONFIGURATION MINIMALE REQUISE (Paramètres Boutique)
INSERT INTO maisonkenzi.app_settings (id, maintenance_mode, maintenance_message, instagram_url, whatsapp_phone, bot_enabled, bot_name, bot_welcome)
VALUES (true, false, 'Maison Kenzi prépare de nouvelles créations. Revenez très bientôt.', 'https://instagram.com/maisonkenzi', '212752850156', true, 'Conseillère Maison Kenzi', 'Bienvenue chez Maison Kenzi. Comment puis-je vous orienter parmi nos créations de niche ?')
ON CONFLICT (id) DO NOTHING;
