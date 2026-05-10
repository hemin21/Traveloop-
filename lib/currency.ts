/**
 * Multi-Currency System for Traveloop
 * Supports 20+ currencies with symbols, exchange rates relative to USD, and formatting.
 * Exchange rates are approximate and should be updated from a live API in production.
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  /** Rate relative to 1 USD. e.g., 83.5 means 1 USD = 83.5 INR */
  rateFromUSD: number;
  locale: string; // for Intl.NumberFormat
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar",         symbol: "$",    flag: "🇺🇸", rateFromUSD: 1,        locale: "en-US" },
  { code: "EUR", name: "Euro",              symbol: "€",    flag: "🇪🇺", rateFromUSD: 0.92,     locale: "de-DE" },
  { code: "GBP", name: "British Pound",     symbol: "£",    flag: "🇬🇧", rateFromUSD: 0.79,     locale: "en-GB" },
  { code: "INR", name: "Indian Rupee",      symbol: "₹",    flag: "🇮🇳", rateFromUSD: 83.5,     locale: "en-IN" },
  { code: "JPY", name: "Japanese Yen",      symbol: "¥",    flag: "🇯🇵", rateFromUSD: 149.5,    locale: "ja-JP" },
  { code: "AED", name: "UAE Dirham",        symbol: "د.إ",  flag: "🇦🇪", rateFromUSD: 3.67,     locale: "ar-AE" },
  { code: "SGD", name: "Singapore Dollar",  symbol: "S$",   flag: "🇸🇬", rateFromUSD: 1.34,     locale: "en-SG" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$",   flag: "🇦🇺", rateFromUSD: 1.52,     locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar",   symbol: "C$",   flag: "🇨🇦", rateFromUSD: 1.36,     locale: "en-CA" },
  { code: "CHF", name: "Swiss Franc",       symbol: "Fr",   flag: "🇨🇭", rateFromUSD: 0.89,     locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan",      symbol: "¥",    flag: "🇨🇳", rateFromUSD: 7.24,     locale: "zh-CN" },
  { code: "KRW", name: "South Korean Won",  symbol: "₩",    flag: "🇰🇷", rateFromUSD: 1320,     locale: "ko-KR" },
  { code: "THB", name: "Thai Baht",         symbol: "฿",    flag: "🇹🇭", rateFromUSD: 35.5,     locale: "th-TH" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp",   flag: "🇮🇩", rateFromUSD: 15750,    locale: "id-ID" },
  { code: "BRL", name: "Brazilian Real",    symbol: "R$",   flag: "🇧🇷", rateFromUSD: 5.05,     locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso",      symbol: "$",    flag: "🇲🇽", rateFromUSD: 17.2,     locale: "es-MX" },
  { code: "TRY", name: "Turkish Lira",      symbol: "₺",    flag: "🇹🇷", rateFromUSD: 32.5,     locale: "tr-TR" },
  { code: "ZAR", name: "South African Rand",symbol: "R",    flag: "🇿🇦", rateFromUSD: 18.5,     locale: "en-ZA" },
  { code: "EGP", name: "Egyptian Pound",    symbol: "E£",   flag: "🇪🇬", rateFromUSD: 30.9,     locale: "ar-EG" },
  { code: "MAD", name: "Moroccan Dirham",   symbol: "د.م.", flag: "🇲🇦", rateFromUSD: 10.0,     locale: "ar-MA" },
  { code: "VND", name: "Vietnamese Dong",   symbol: "₫",    flag: "🇻🇳", rateFromUSD: 24850,    locale: "vi-VN" },
  { code: "CZK", name: "Czech Koruna",      symbol: "Kč",   flag: "🇨🇿", rateFromUSD: 23.5,     locale: "cs-CZ" },
  { code: "NZD", name: "New Zealand Dollar",symbol: "NZ$",  flag: "🇳🇿", rateFromUSD: 1.63,     locale: "en-NZ" },
  { code: "SEK", name: "Swedish Krona",     symbol: "kr",   flag: "🇸🇪", rateFromUSD: 10.5,     locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone",   symbol: "kr",   flag: "🇳🇴", rateFromUSD: 10.6,     locale: "nb-NO" },
  { code: "PLN", name: "Polish Zloty",      symbol: "zł",   flag: "🇵🇱", rateFromUSD: 4.05,     locale: "pl-PL" },
  { code: "HKD", name: "Hong Kong Dollar",  symbol: "HK$",  flag: "🇭🇰", rateFromUSD: 7.82,     locale: "zh-HK" },
  { code: "PKR", name: "Pakistani Rupee",   symbol: "₨",    flag: "🇵🇰", rateFromUSD: 278,      locale: "ur-PK" },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

/**
 * Convert a USD amount to any currency.
 */
export function convertFromUSD(amountUSD: number, targetCurrencyCode: string): number {
  const currency = getCurrency(targetCurrencyCode);
  return amountUSD * currency.rateFromUSD;
}

/**
 * Convert from any currency back to USD.
 */
export function convertToUSD(amount: number, fromCurrencyCode: string): number {
  const currency = getCurrency(fromCurrencyCode);
  return amount / currency.rateFromUSD;
}

/**
 * Format a monetary amount in the given currency with proper locale-aware formatting.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" || currencyCode === "IDR" || currencyCode === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't support this currency
    return `${currency.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Display a compact version like "$1.2K" for large values.
 */
export function formatCurrencyCompact(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (amount >= 1_000_000) return `${currency.symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${currency.symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${currency.symbol}${amount.toFixed(0)}`;
}
