DROP TRIGGER IF EXISTS trg_orders_upsert_customer ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS orders_upsert_customer ON public.orders;
DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;

CREATE TRIGGER orders_upsert_customer
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.upsert_customer_from_order();

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();