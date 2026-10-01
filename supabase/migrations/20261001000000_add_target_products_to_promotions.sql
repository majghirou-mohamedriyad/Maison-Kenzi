-- Migration : Ajout du ciblage par produits spécifiques et catégories aux promotions
-- Permet de définir des promotions valables uniquement sur une sélection précise de produits.

ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'all',
ADD COLUMN IF NOT EXISTS target_products JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS target_product_names JSONB DEFAULT '[]'::jsonb;

-- Index GIN pour les requêtes sur target_products si besoin
CREATE INDEX IF NOT EXISTS idx_promotions_target_type ON public.promotions(target_type);
