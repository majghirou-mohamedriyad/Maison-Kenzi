-- Migration : Table des Clients — Maison Kenzi
-- Création de la table customers avec support complet des coordonnées personnelles
-- (Nom, Prénom, Email, Téléphone, Date de Naissance, Adresse, Ville, Pays)

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL DEFAULT '',
  last_name VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  birth_date VARCHAR(20) DEFAULT '',
  address TEXT DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  country VARCHAR(100) DEFAULT 'Belgique',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour accélérer les recherches par email, téléphone et nom
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);

-- Activation de la sécurité Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : Lecture et écriture pour la gestion des profils et l'administration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'Permettre acces complet customers'
  ) THEN
    CREATE POLICY "Permettre acces complet customers"
      ON public.customers
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
