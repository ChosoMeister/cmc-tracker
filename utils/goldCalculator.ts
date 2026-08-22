import { CoinBubbleInfo, PriceData } from '../types';

export const OUNCE_GRAMS = 31.1034768;
export const DEFAULT_MINTING_FEE = 10000; // تومان

export interface CoinSpecification {
  symbol: string;
  name: string;
  weightGrams: number;
  purity: number; // 0.900 for coins, 0.750 for 18k
  mintingFee: number;
}

export const COIN_SPECS: CoinSpecification[] = [
  {
    symbol: 'SEKKEH',
    name: 'سکه تمام امامی (طرح جدید)',
    weightGrams: 8.133,
    purity: 0.900,
    mintingFee: 10000,
  },
  {
    symbol: 'BAHAR',
    name: 'سکه تمام بهار آزادی (طرح قدیم)',
    weightGrams: 8.133,
    purity: 0.900,
    mintingFee: 10000,
  },
  {
    symbol: 'NIM',
    name: 'نیم سکه بهار آزادی',
    weightGrams: 4.066,
    purity: 0.900,
    mintingFee: 7000,
  },
  {
    symbol: 'ROB',
    name: 'ربع سکه بهار آزادی',
    weightGrams: 2.033,
    purity: 0.900,
    mintingFee: 5000,
  },
  {
    symbol: 'SEK',
    name: 'سکه گرمی',
    weightGrams: 1.010,
    purity: 0.900,
    mintingFee: 3000,
  },
  {
    symbol: 'GOLD18',
    name: 'یک گرم طلای ۱۸ عیار',
    weightGrams: 1.000,
    purity: 0.750,
    mintingFee: 0,
  },
  {
    symbol: 'ABSHODEH',
    name: 'یک مثقال طلای آبشده',
    weightGrams: 4.6083,
    purity: 0.705, // ۱۷ عیار
    mintingFee: 0,
  },
];

/**
 * محاسبه ارزش ذاتی طلا/سکه بر اساس انس جهانی و نرخ دلار
 */
export const calculateIntrinsicValue = (
  spec: CoinSpecification,
  usdRate: number,
  ounceUsd: number
): number => {
  if (!usdRate || !ounceUsd) return 0;
  // قیمت یک گرم طلای ۲۴ عیار به تومان
  const gram24kToman = (ounceUsd * usdRate) / OUNCE_GRAMS;
  // ارزش طلای خالص درون سکه
  const intrinsicGoldToman = spec.weightGrams * spec.purity * gram24kToman;
  return Math.round(intrinsicGoldToman + spec.mintingFee);
};

/**
 * محاسبه حباب برای تمام مسکوکات و طلا
 */
export const calculateAllBubbles = (
  prices: PriceData | null,
  customUsdRate?: number,
  customOunceUsd?: number
): CoinBubbleInfo[] => {
  if (!prices) return [];

  const usdRate = customUsdRate || prices.usdToToman || 70000;
  // اگر انس جهانی در لیست قیمت‌های طلا نبود، از محاسبه معکوس طلای ۱۸ عیار یا مقدار پیش‌فرض استفاده می‌کنیم
  const ounceUsd =
    customOunceUsd ||
    (prices.goldPricesToman?.USD_XAU
      ? prices.goldPricesToman.USD_XAU / usdRate
      : (prices.gold18ToToman * OUNCE_GRAMS) / (0.75 * usdRate));

  const marketPrices: Record<string, number> = {
    ...prices.goldPricesToman,
    GOLD18: prices.gold18ToToman,
  };

  return COIN_SPECS.map((spec) => {
    const intrinsicValue = calculateIntrinsicValue(spec, usdRate, ounceUsd);
    const marketPrice = marketPrices[spec.symbol] || intrinsicValue;
    const bubbleToman = marketPrice - intrinsicValue;
    const bubblePercent = intrinsicValue > 0 ? (bubbleToman / intrinsicValue) * 100 : 0;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (bubblePercent > 20) {
      riskLevel = 'HIGH';
    } else if (bubblePercent > 10) {
      riskLevel = 'MEDIUM';
    }

    return {
      symbol: spec.symbol,
      name: spec.name,
      weightGrams: spec.weightGrams,
      carat: Math.round(spec.purity * 24),
      marketPriceToman: marketPrice,
      intrinsicValueToman: intrinsicValue,
      bubbleToman,
      bubblePercent,
      riskLevel,
    };
  });
};
