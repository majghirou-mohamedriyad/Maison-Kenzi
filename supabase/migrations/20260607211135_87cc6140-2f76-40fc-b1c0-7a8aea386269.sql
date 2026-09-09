
CREATE TABLE public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT NOT NULL DEFAULT 'Nous améliorons votre expérience. Revenez très bientôt.',
  instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/',
  whatsapp_phone TEXT NOT NULL DEFAULT '212600000000',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can insert app settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
