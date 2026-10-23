-- ==============================================================================
-- Migration : Ajout des colonnes has_tiers et quantity_tiers sur maisonkenzi.parfums
-- Date : 2026-10-23
-- Description : Ajoute le support des paliers de quantité (remises dégressives)
--               et rafraîchit le cache du schéma PostgREST.
-- ==============================================================================

ALTER TABLE IF EXISTS maisonkenzi.parfums
  ADD COLUMN IF NOT EXISTS has_tiers BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quantity_tiers JSONB DEFAULT '[]'::jsonb;

-- Rafraîchissement du cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
