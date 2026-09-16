/**
 * Contexte & Hook de Gestion Multi-Devises — Maison Kenzi
 *
 * Intègre l'API officielle FreeCurrencyAPI (fca_live_...) pour la conversion
 * en temps réel des prix depuis la devise de base (MAD - Dirham Marocain).
 * Met en cache les taux de change (12h) avec repli automatique sécurisé.
 * Zéro Emoji — Icônes vectorielles lucide-react et typographie éditoriale de prestige.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type CurrencyCode =
  | "MAD"
  | "EUR"
  | "USD"
  | "USDT"
  | "AED"
  | "GBP"
  | "SAR"
  | "CAD"
  | "CHF"
  | "QAR"
  | "KWD";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  nameFr: string;
  nameEn: string;
  decimals: number;
  prefix: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  MAD: {
    code: "MAD",
    symbol: "MAD",
    nameFr: "Dirham Marocain",
    nameEn: "Moroccan Dirham",
    decimals: 0,
    prefix: false,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    nameFr: "Euro",
    nameEn: "Euro",
    decimals: 2,
    prefix: false,
  },
  USD: {
    code: "USD",
    symbol: "$",
    nameFr: "Dollar Américain",
    nameEn: "US Dollar",
    decimals: 2,
    prefix: true,
  },
  USDT: {
    code: "USDT",
    symbol: "USDT",
    nameFr: "Tether USD",
    nameEn: "Tether USDT",
    decimals: 2,
    prefix: false,
  },
  AED: {
    code: "AED",
    symbol: "AED",
    nameFr: "Dirham Émirati",
    nameEn: "UAE Dirham",
    decimals: 2,
    prefix: false,
  },
  SAR: {
    code: "SAR",
    symbol: "SAR",
    nameFr: "Riyal Saoudien",
    nameEn: "Saudi Riyal",
    decimals: 2,
    prefix: false,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    nameFr: "Livre Sterling",
    nameEn: "British Pound",
    decimals: 2,
    prefix: true,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    nameFr: "Dollar Canadien",
    nameEn: "Canadian Dollar",
    decimals: 2,
    prefix: true,
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    nameFr: "Franc Suisse",
    nameEn: "Swiss Franc",
    decimals: 2,
    prefix: false,
  },
  QAR: {
    code: "QAR",
    symbol: "QAR",
    nameFr: "Riyal Qatari",
    nameEn: "Qatari Riyal",
    decimals: 2,
    prefix: false,
  },
  KWD: {
    code: "KWD",
    symbol: "KWD",
    nameFr: "Dinar Koweïtien",
    nameEn: "Kuwaiti Dinar",
    decimals: 3,
    prefix: false,
  },
};

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  MAD: 1.0,
  EUR: 0.093,
  USD: 0.101,
  USDT: 0.101,
  AED: 0.371,
  SAR: 0.379,
  GBP: 0.079,
  CAD: 0.138,
  CHF: 0.089,
  QAR: 0.368,
  KWD: 0.031,
};

const FREECURRENCY_API_KEY = "fca_live_Qio3fMxgttzEnH0otmVshgQtsXZne5gouGtHYgTN";
const STORAGE_CURRENCY_KEY = "mk_selected_currency";
const STORAGE_RATES_KEY = "mk_currency_rates_cache";
const STORAGE_TIME_KEY = "mk_currency_rates_time";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  convertPrice: (amountInMAD: number) => number;
  formatPrice: (amountInMAD: number, customDecimals?: number) => string;
  currencyMeta: CurrencyMeta;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Helper global accessible en dehors des composants React
let globalCurrency: CurrencyCode = "MAD";
let globalRates: Record<CurrencyCode, number> = DEFAULT_RATES;

export const getGlobalCurrency = () => globalCurrency;
export const getGlobalRates = () => globalRates;

export const formatGlobalPrice = (amountInMAD: number, overrideCurrency?: CurrencyCode): string => {
  const code = overrideCurrency || globalCurrency;
  const meta = CURRENCIES[code] || CURRENCIES.MAD;
  const rate = globalRates[code] || 1;
  const converted = Number(amountInMAD || 0) * rate;

  const decimals = meta.decimals;
  const formattedNumber = converted.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).replace(/[\u00A0\u202F\s]/g, " ");

  if (meta.prefix) {
    return `${meta.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${meta.symbol}`;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENCY_KEY) as CurrencyCode;
      if (saved && saved in CURRENCIES) return saved;
    } catch {
      // Ignorer
    }
    return "MAD";
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_RATES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...DEFAULT_RATES, ...parsed };
      }
    } catch {
      // Ignorer
    }
    return DEFAULT_RATES;
  });

  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Synchronisation des variables globales
  useEffect(() => {
    globalCurrency = currency;
  }, [currency]);

  useEffect(() => {
    globalRates = rates;
  }, [rates]);

  // Récupération des taux de change en direct depuis FreeCurrencyAPI
  const fetchRates = useCallback(async () => {
    try {
      // Vérifier le cache
      const cachedTimeStr = localStorage.getItem(STORAGE_TIME_KEY);
      const cachedTime = cachedTimeStr ? Number(cachedTimeStr) : 0;
      const isCacheValid = Date.now() - cachedTime < CACHE_TTL_MS;

      if (isCacheValid) {
        const cachedRates = localStorage.getItem(STORAGE_RATES_KEY);
        if (cachedRates) {
          const parsed = JSON.parse(cachedRates);
          setRates((prev) => ({ ...prev, ...parsed }));
          return;
        }
      }

      setIsLoadingRates(true);

      const targetCurrencies = "EUR,USD,AED,SAR,GBP,CAD,CHF,QAR,KWD";
      const url = `https://api.freecurrencyapi.com/v1/latest?apikey=${FREECURRENCY_API_KEY}&base_currency=MAD&currencies=${targetCurrencies}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const json = await res.json();
      if (json && json.data) {
        const apiData = json.data;
        const newRates: Record<CurrencyCode, number> = {
          MAD: 1.0,
          EUR: Number(apiData.EUR) || DEFAULT_RATES.EUR,
          USD: Number(apiData.USD) || DEFAULT_RATES.USD,
          USDT: Number(apiData.USD) || DEFAULT_RATES.USD, // USDT adossé 1:1 à l'USD
          AED: Number(apiData.AED) || DEFAULT_RATES.AED,
          SAR: Number(apiData.SAR) || DEFAULT_RATES.SAR,
          GBP: Number(apiData.GBP) || DEFAULT_RATES.GBP,
          CAD: Number(apiData.CAD) || DEFAULT_RATES.CAD,
          CHF: Number(apiData.CHF) || DEFAULT_RATES.CHF,
          QAR: Number(apiData.QAR) || DEFAULT_RATES.QAR,
          KWD: Number(apiData.KWD) || DEFAULT_RATES.KWD,
        };

        setRates(newRates);
        localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(newRates));
        localStorage.setItem(STORAGE_TIME_KEY, String(Date.now()));
      }
    } catch (err) {
      console.warn("Utilisation des taux de change de repli Maison Kenzi:", err);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = (code: CurrencyCode) => {
    if (code in CURRENCIES) {
      setCurrencyState(code);
      try {
        localStorage.setItem(STORAGE_CURRENCY_KEY, code);
      } catch (e) {
        console.warn("Impossible de sauvegarder la devise:", e);
      }
    }
  };

  const convertPrice = useCallback(
    (amountInMAD: number): number => {
      const rate = rates[currency] || 1;
      return Number((Number(amountInMAD || 0) * rate).toFixed(4));
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (amountInMAD: number, customDecimals?: number): string => {
      const meta = CURRENCIES[currency] || CURRENCIES.MAD;
      const rate = rates[currency] || 1;
      const converted = Number(amountInMAD || 0) * rate;

      const decimals = typeof customDecimals === "number" ? customDecimals : meta.decimals;
      const formattedNumber = converted.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).replace(/[\u00A0\u202F\s]/g, " ");

      if (meta.prefix) {
        return `${meta.symbol}${formattedNumber}`;
      }
      return `${formattedNumber} ${meta.symbol}`;
    },
    [currency, rates]
  );

  const currencyMeta = useMemo(() => CURRENCIES[currency] || CURRENCIES.MAD, [currency]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        convertPrice,
        formatPrice,
        currencyMeta,
        isLoadingRates,
        refreshRates: fetchRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency doit être utilisé au sein d'un CurrencyProvider");
  }
  return context;
};
