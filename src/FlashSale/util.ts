import { staticFile } from "remotion";

export const src = (path: string) =>
  /^https?:\/\//.test(path) ? path : staticFile(path);

export const formatPrice = (value: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
