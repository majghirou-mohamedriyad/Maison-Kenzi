/**
 * Contexte & Utilitaires de Devise — Maison Kenzi
 *
 * Devise Unique et Exclusive : EURO (€)
 * Tous les prix sont affichés et débités en Euro dans l'ensemble de la boutique et de l'administration.
 * Zéro Emoji — Conforme à la charte Maison Kenzi.
 */

import React, { createContext, useContext, useMemo } from "react";
import { formatEUR } from "@/lib/sizes";

export type CurrencyCode = "EUR";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  nameFr: string;
  nameEn: string;
  decimals: number;
  prefix: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  EUR: {
    code: "EUR",
    symbol: "€",
    nameFr: "Euro",
    nameEn: "Euro",
    decimals: 2,
    prefix: false,
  },
};

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  EUR: 1.0,
};

export const getGlobalCurrency = () => "EUR" as const;
export const getGlobalRates = () => DEFAULT_RATES;
export const formatGlobalPrice = (amount: number | string | null | undefined): string => formatEUR(amount);

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: any) => void;
  rates: Record<CurrencyCode, number>;
  convertPrice: (amount: number) => number;
  formatPrice: (amount: number) => string;
  currencyMeta: CurrencyMeta;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
}

const defaultContextValue: CurrencyContextType = {
  currency: "EUR",
  setCurrency: () => {},
  rates: DEFAULT_RATES,
  convertPrice: (amount: number) => Number(amount || 0),
  formatPrice: (amount: number) => formatEUR(amount),
  currencyMeta: CURRENCIES.EUR,
  isLoadingRates: false,
  refreshRates: async () => {},
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContextValue);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo(() => defaultContextValue, []);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  return useContext(CurrencyContext) || defaultContextValue;
};

export const useFormatPrice = () => {
  return {
    currency: "EUR" as const,
    formatPrice: formatEUR,
    convertPrice: (amount: number) => Number(amount || 0),
    currencyMeta: CURRENCIES.EUR,
    rates: DEFAULT_RATES,
    format: formatEUR,
  };
};

export default CurrencyContext;
