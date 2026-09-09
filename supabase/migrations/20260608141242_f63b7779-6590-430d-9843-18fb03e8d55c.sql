
CREATE TABLE public.flaconnage (
  size text PRIMARY KEY CHECK (size IN ('5ml','10ml','full')),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_threshold integer NOT NULL DEFAULT 5 CHECK (low_threshold >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flaconnage TO authenticated;
GRANT ALL ON public.flaconnage TO service_role;

ALTER TABLE public.flaconnage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read flaconnage" ON public.flaconnage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert flaconnage" ON public.flaconnage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update flaconnage" ON public.flaconnage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete flaconnage" ON public.flaconnage FOR DELETE TO authenticated USING (true);

CREATE TRIGGER flaconnage_set_updated_at BEFORE UPDATE ON public.flaconnage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.flaconnage (size, stock, low_threshold) VALUES
  ('5ml', 0, 5),
  ('10ml', 0, 5),
  ('full', 0, 5);
