/**
 * Hook de Récupération des Pays & Villes (Maroc & Europe) — Maison Kenzi
 *
 * Utilise l'API REST Countries avec mise en cache locale et gestion de secours instantanée.
 */

import { useState, useEffect, useMemo } from "react";
import {
  fetchMoroccoAndEuropeCountries,
  FALLBACK_COUNTRIES,
  getCitiesForCountry,
  RestCountry,
} from "@/services/restCountriesService";

export function useCountries() {
  const [countries, setCountries] = useState<RestCountry[]>(FALLBACK_COUNTRIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMoroccoAndEuropeCountries()
      .then((data) => {
        if (mounted && data.length > 0) {
          setCountries(data);
        }
      })
      .catch((err) => {
        console.warn("Erreur chargement pays:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    countries,
    loading,
    getCities: getCitiesForCountry,
  };
}
