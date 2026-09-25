
import { getAssetDetail } from '../types';

export const formatToman = (value: number, lang: 'fa' | 'en' = 'fa'): string => {
  const locale = lang === 'en' ? 'en-US' : 'fa-IR';
  return new Intl.NumberFormat(locale).format(Math.round(value));
};

export const formatNumber = (value: number, decimals = 2, lang: 'fa' | 'en' = 'fa'): string => {
  // اگر عدد خیلی کوچک بود اعشار بیشتری نشان بده
  const finalDecimals = value < 1 && value > 0 ? Math.max(decimals, 4) : decimals;
  const locale = lang === 'en' ? 'en-US' : 'fa-IR';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: finalDecimals,
  }).format(value);
};

export const formatPercent = (value: number, lang: 'fa' | 'en' = 'fa'): string => {
  const sign = value > 0 ? '+' : '';
  const locale = lang === 'en' ? 'en-US' : 'fa-IR';
  const suffix = lang === 'en' ? '%' : '٪';
  return `${sign}${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}${suffix}`;
};

export const toEnglishDigits = (str: string): string => {
  if (!str) return "";
  return str
    .toString()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

export const formatCurrencyInput = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const cleanVal = toEnglishDigits(val.toString()).replace(/,/g, "").trim();
  if (!cleanVal || isNaN(Number(cleanVal))) return cleanVal;
  const parts = cleanVal.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

export const parseCurrencyInput = (val: string | number) => {
  if (!val) return 0;
  const cleanVal = toEnglishDigits(val.toString()).replace(/,/g, "").trim();
  const num = parseFloat(cleanVal);
  return isNaN(num) ? 0 : num;
};

const CRYPTO_ICON_CDN_BASE = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color';
const CRYPTO_ICON_GENERIC = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: `${CRYPTO_ICON_CDN_BASE}/btc.png`,
  ETH: `${CRYPTO_ICON_CDN_BASE}/eth.png`,
  ETC: `${CRYPTO_ICON_CDN_BASE}/etc.png`,
  ADA: `${CRYPTO_ICON_CDN_BASE}/ada.png`,
  USDT: `${CRYPTO_ICON_CDN_BASE}/usdt.png`,
  BNB: `${CRYPTO_ICON_CDN_BASE}/bnb.png`,
  XRP: `${CRYPTO_ICON_CDN_BASE}/xrp.png`,
  SHIB: `${CRYPTO_ICON_CDN_BASE}/shib.png`,
  SOL: `${CRYPTO_ICON_CDN_BASE}/sol.png`,
  TON: `${CRYPTO_ICON_CDN_BASE}/ton.png`,
  TRX: `${CRYPTO_ICON_CDN_BASE}/trx.png`,
  LTC: `${CRYPTO_ICON_CDN_BASE}/ltc.png`,
};

const FIAT_FLAG_MAP: Record<string, string> = {
  USD: 'us', EUR: 'eu', AED: 'ae', TRY: 'tr', GBP: 'gb', CNY: 'cn', CAD: 'ca', AUD: 'au', RUB: 'ru',
  IQD: 'iq', MYR: 'my', GEL: 'ge', AZN: 'az', AMD: 'am', THB: 'th', OMR: 'om', INR: 'in',
  PKR: 'pk', JPY: 'jp', SAR: 'sa', AFN: 'af', SEK: 'se', CHF: 'ch', QAR: 'qa', KRW: 'kr',
  NOK: 'no', NZD: 'nz', SGD: 'sg', HKD: 'hk', KWD: 'kw', DKK: 'dk', BHD: 'bh', TJS: 'tj',
  TMT: 'tm', KGS: 'kg', SYP: 'sy', BRL: 'br', ARS: 'ar',
  'EUR-IST': 'eu', 'EUR-HAV': 'eu', 'USD-HAV': 'us', 'USD-IST': 'us', 'USD-SULAYMANIYAH': 'us', 'USD-HERAT': 'us',
};

const GOLD_ICON_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23f59e0b"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23gGold)"/><circle cx="64" cy="64" r="46" fill="%2378350f" opacity="0.2"/><text x="64" y="75" text-anchor="middle" font-size="28" font-family="sans-serif" font-weight="900" fill="%23ffffff">طلا</text></svg>';

const GOLD_ICON_MAP: Record<string, string> = {
  GOLD18: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g18" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fbbf24"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23g18)"/><circle cx="64" cy="64" r="44" fill="%2378350f" opacity="0.2"/><text x="64" y="74" text-anchor="middle" font-size="28" font-family="sans-serif" font-weight="900" fill="%23ffffff">18K</text></svg>',
  '18AYAR': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g18a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fbbf24"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23g18a)"/><circle cx="64" cy="64" r="44" fill="%2378350f" opacity="0.2"/><text x="64" y="74" text-anchor="middle" font-size="28" font-family="sans-serif" font-weight="900" fill="%23ffffff">18K</text></svg>',
  GOLD24: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g24" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fde047"/><stop offset="1" stop-color="%23ca8a04"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23g24)"/><circle cx="64" cy="64" r="44" fill="%23713f12" opacity="0.2"/><text x="64" y="74" text-anchor="middle" font-size="28" font-family="sans-serif" font-weight="900" fill="%23ffffff">24K</text></svg>',
  ABSHODEH: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gAb" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23f59e0b"/><stop offset="1" stop-color="%23b45309"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23gAb)"/><circle cx="64" cy="64" r="44" fill="%2378350f" opacity="0.2"/><text x="64" y="74" text-anchor="middle" font-size="26" font-family="sans-serif" font-weight="900" fill="%23ffffff">مثقال</text></svg>',
  SEKKEH: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gEm" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gEm)" stroke="%23b45309" stroke-width="4"/><circle cx="64" cy="64" r="48" fill="none" stroke="%23ffffff" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">امامی</text></svg>',
  EMAMI: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gEm2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gEm2)" stroke="%23b45309" stroke-width="4"/><circle cx="64" cy="64" r="48" fill="none" stroke="%23ffffff" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">امامی</text></svg>',
  BAHAR: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gBah" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gBah)" stroke="%23b45309" stroke-width="4"/><circle cx="64" cy="64" r="48" fill="none" stroke="%23ffffff" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">بهار</text></svg>',
  NIM: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gNim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gNim)" stroke="%23b45309" stroke-width="4"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">نیم</text></svg>',
  ROB: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gRob" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gRob)" stroke="%23b45309" stroke-width="4"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">ربع</text></svg>',
  SEK: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gSek" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fcd34d"/><stop offset="1" stop-color="%23d97706"/></linearGradient></defs><circle cx="64" cy="64" r="58" fill="url(%23gSek)" stroke="%23b45309" stroke-width="4"/><text x="64" y="74" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="900" fill="%2378350f">گرمی</text></svg>',
  USD_XAU: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="gXau" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23fde047"/><stop offset="1" stop-color="%23b45309"/></linearGradient></defs><rect rx="28" width="128" height="128" fill="url(%23gXau)"/><circle cx="64" cy="64" r="44" fill="%2378350f" opacity="0.2"/><text x="64" y="74" text-anchor="middle" font-size="26" font-family="sans-serif" font-weight="900" fill="%23ffffff">اونس</text></svg>'
};

const CRYPTO_ICON_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%230f172a"/><stop offset="1" stop-color="%232563eb"/></linearGradient></defs><rect rx="24" width="128" height="128" fill="url(%23g)"/><circle cx="64" cy="64" r="46" fill="%230b1221" opacity="0.65"/><text x="64" y="74" text-anchor="middle" font-size="32" font-family="Inter,Arial" font-weight="700" fill="%23e2e8f0">CR</text></svg>';
const FIAT_FLAG_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%231e293b"/><stop offset="1" stop-color="%230ea5e9"/></linearGradient></defs><rect width="160" height="120" rx="14" fill="url(%23fg)"/><rect x="12" y="16" width="136" height="88" rx="10" fill="%230b1221" opacity="0.6"/><text x="80" y="76" text-anchor="middle" font-family="Inter,Arial" font-size="32" font-weight="800" fill="%23e2e8f0">FX</text></svg>';

const getFiatIcon = (symbol: string) => {
  const flagCode = FIAT_FLAG_MAP[symbol];
  if (flagCode) {
    return `https://flagcdn.com/${flagCode}.svg`;
  }
  return FIAT_FLAG_FALLBACK;
};

export const getAssetIconUrl = (symbol: string): string => {
  const detail = getAssetDetail(symbol);

  if (detail.type === 'CRYPTO') {
    return CRYPTO_ICON_MAP[symbol] || `${CRYPTO_ICON_CDN_BASE}/${symbol.toLowerCase()}.png`;
  }

  if (detail.type === 'FIAT') {
    return getFiatIcon(symbol);
  }

  // طلا و سکه با آیکون‌های وکتور اختصاصی
  return GOLD_ICON_MAP[symbol] || GOLD_ICON_FALLBACK;
};

export const getAssetFallbackIcon = (symbol: string): string => {
  const detail = getAssetDetail(symbol);
  if (detail.type === 'CRYPTO') return CRYPTO_ICON_GENERIC || CRYPTO_ICON_FALLBACK;
  if (detail.type === 'FIAT') return FIAT_FLAG_FALLBACK;
  return GOLD_ICON_FALLBACK;
};
