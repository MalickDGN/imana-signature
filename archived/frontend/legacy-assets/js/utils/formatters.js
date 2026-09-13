import { APP_CONFIG } from "../config.js";

export function formatCurrency(value) {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: "currency",
    currency: APP_CONFIG.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeSearchValue(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}