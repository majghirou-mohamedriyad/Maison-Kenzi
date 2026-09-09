
-- 1) Remove direct anon INSERT on orders; only service_role (edge function) can insert
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
REVOKE INSERT ON public.orders FROM anon;

-- 2) Defense-in-depth constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_total_amount_nonneg;
ALTER TABLE public.orders ADD CONSTRAINT orders_total_amount_nonneg CHECK (total_amount >= 0);

-- 3) Public read for product-images storage bucket
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');
