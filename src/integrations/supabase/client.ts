/**
 * Client Supabase — Maison Kenzi
 *
 * Initialise le client officiel @supabase/supabase-js relié au schéma dédié 'maisonkenzi'.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const resolveSupabaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || "http://185.197.249.4:8000").trim();
  if (typeof window !== "undefined") {
    // Si l'application tourne sur un domaine sécurisé HTTPS (ex: Vercel) et que l'URL VPS est en HTTP,
    // on route automatiquement via le proxy sécurisé /api/supabase pour éliminer les erreurs Mixed Content et CSP
    if (window.location.protocol === "https:" && envUrl.startsWith("http://")) {
      return `${window.location.origin}/api/supabase`;
    }
  }
  return envUrl;
};

const SUPABASE_URL = resolveSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'maisonkenzi',
  },
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});