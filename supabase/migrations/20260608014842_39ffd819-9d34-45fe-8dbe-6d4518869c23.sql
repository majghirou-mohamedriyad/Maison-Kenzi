
CREATE TABLE public.bot_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bot_qa TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_qa TO authenticated;
GRANT ALL ON public.bot_qa TO service_role;

ALTER TABLE public.bot_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active bot qa" ON public.bot_qa FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert bot qa" ON public.bot_qa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update bot qa" ON public.bot_qa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete bot qa" ON public.bot_qa FOR DELETE TO authenticated USING (true);

CREATE TRIGGER bot_qa_updated_at BEFORE UPDATE ON public.bot_qa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bot_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bot_name text NOT NULL DEFAULT 'Assistante Myaura';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bot_welcome text NOT NULL DEFAULT 'Bonjour 👋 Comment puis-je vous aider aujourd''hui ?';

INSERT INTO public.bot_qa (question, answer, sort_order) VALUES
  ('Quels sont vos délais de livraison ?', 'La livraison prend généralement 2 à 5 jours ouvrables au Maroc.', 1),
  ('Comment passer une commande ?', 'Choisissez vos parfums, ajoutez-les au panier, puis finalisez via WhatsApp. Nous vous contactons pour confirmer.', 2),
  ('Quels modes de paiement acceptez-vous ?', 'Paiement à la livraison (cash) partout au Maroc.', 3),
  ('Puis-je retourner un parfum ?', 'Les parfums ouverts ne sont pas repris pour des raisons d''hygiène. Contactez-nous en cas de problème.', 4)
ON CONFLICT DO NOTHING;
