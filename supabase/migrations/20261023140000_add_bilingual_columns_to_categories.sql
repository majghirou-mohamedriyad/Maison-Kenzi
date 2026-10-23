-- Migration : Ajout des colonnes bilingues anglais et attributs étendus à la table categories
-- Permet la sauvegarde et la persistance de Category Name (EN) et Collection Description (EN)

ALTER TABLE IF EXISTS maisonkenzi.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE IF EXISTS maisonkenzi.categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE IF EXISTS maisonkenzi.categories ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS maisonkenzi.categories ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;

-- Assurer aussi sur le schéma public au cas où
ALTER TABLE IF EXISTS public.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE IF EXISTS public.categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE IF EXISTS public.categories ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS public.categories ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;

-- Notifier PostgREST pour actualiser immédiatement le cache de son schéma
NOTIFY pgrst, 'reload schema';
