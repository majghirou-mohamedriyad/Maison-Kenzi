-- Migration : Système de Promotions & Coupons — Maison Kenzi
-- Création des tables promotions et promotion_redemptions avec RLS et fonction d'incrémentation.

-- 1. Table principale des promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  once_per_customer BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ DEFAULT NULL,
  target_category VARCHAR(50) DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table de suivi des utilisations par client
CREATE TABLE IF NOT EXISTS public.promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  promo_code VARCHAR(50) NOT NULL,
  order_number VARCHAR(100),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(150),
  discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches rapides d'unicité
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_redemptions_phone ON public.promotion_redemptions(customer_phone, promo_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_email ON public.promotion_redemptions(customer_email, promo_code);

-- 3. Fonction SQL d'incrémentation d'utilisation sécurisée
CREATE OR REPLACE FUNCTION public.increment_promo_usage(promo_code_arg VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promotions
  SET current_uses = COALESCE(current_uses, 0) + 1,
      updated_at = NOW()
  WHERE UPPER(code) = UPPER(promo_code_arg);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Politiques RLS (Row Level Security)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;

-- Lecture publique des promotions actives pour le frontend
CREATE POLICY "Lecture publique des promotions"
  ON public.promotions
  FOR SELECT
  USING (true);

-- Gestion complète pour l'administration et les services
CREATE POLICY "Gestion complète des promotions"
  ON public.promotions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insertion et consultation des utilisations
CREATE POLICY "Gestion des utilisations promotions"
  ON public.promotion_redemptions
  FOR ALL
  USING (true)
  WITH CHECK (true);
