CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_total_amount numeric,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(id uuid, order_number text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NULLIF(trim(p_customer_name), '') IS NULL THEN
    RAISE EXCEPTION 'Nom client requis';
  END IF;

  IF NULLIF(trim(p_customer_email), '') IS NULL THEN
    RAISE EXCEPTION 'Email client requis';
  END IF;

  RETURN QUERY
  INSERT INTO public.orders (
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
    total_amount,
    notes
  )
  VALUES (
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    NULLIF(trim(p_customer_phone), ''),
    NULLIF(trim(p_customer_address), ''),
    COALESCE(p_items, '[]'::jsonb),
    GREATEST(COALESCE(p_total_amount, 0), 0),
    p_notes
  )
  RETURNING public.orders.id, public.orders.order_number;
END
$function$;