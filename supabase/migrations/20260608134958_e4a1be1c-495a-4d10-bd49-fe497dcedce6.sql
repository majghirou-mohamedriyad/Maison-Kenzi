
ALTER TABLE public.parfums
  ADD COLUMN IF NOT EXISTS sale_mode text NOT NULL DEFAULT 'decant',
  ADD COLUMN IF NOT EXISTS full_bottle_volume_ml integer,
  ADD COLUMN IF NOT EXISTS full_bottle_price numeric,
  ADD COLUMN IF NOT EXISTS full_bottle_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_bottle_limited boolean NOT NULL DEFAULT false;

ALTER TABLE public.parfums
  DROP CONSTRAINT IF EXISTS parfums_sale_mode_check;
ALTER TABLE public.parfums
  ADD CONSTRAINT parfums_sale_mode_check
  CHECK (sale_mode IN ('decant', 'full_bottle'));
