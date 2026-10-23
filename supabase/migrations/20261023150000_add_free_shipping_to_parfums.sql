-- Migration : Ajout de la colonne free_shipping pour activer la livraison offerte par produit
-- Permet de definir individuellement si un produit beneficie de la livraison gratuite

ALTER TABLE IF EXISTS maisonkenzi.parfums ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- Notifier PostgREST pour actualiser immédiatement le cache de son schéma
NOTIFY pgrst, 'reload schema';
