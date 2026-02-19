"use client";

import { useCallback } from "react";
import { useFinanceStore } from "./store";
import { CurrencyCode } from "./types";

const currencySymbols: Record<CurrencyCode, string> = {
  USD: "$",
  INR: "Rs",
  EUR: "EUR",
  GBP: "GBP",
  JPY: "JPY",
  AED: "AED",
};

export const getCurrencySymbol = (currency: CurrencyCode) => currencySymbols[currency];

export function useCurrency() {
  const currency = useFinanceStore((state) => state.currency);

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(value),
    [currency],
  );

  return {
    currency,
    currencySymbol: getCurrencySymbol(currency),
    formatCurrency,
  };
}

