export type AssetSymbol = string;
export type AssetType = 'FIAT' | 'GOLD' | 'CRYPTO';
export type Currency = 'TOMAN' | 'USD';

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  assetSymbol: AssetSymbol;
  type?: TransactionType; // Defaults to 'BUY'
  quantity: number;
  buyDateTime: string; // ISO string (used as transaction timestamp)
  buyPricePerUnit: number;
  buyCurrency: Currency;
  feesToman: number;
  note?: string;
  wallet?: string;
  tags?: string[];
}

export interface CoinBubbleInfo {
  symbol: string;
  name: string;
  weightGrams: number;
  carat: number; // 900 for coin, 750 for 18k
  marketPriceToman: number;
  intrinsicValueToman: number;
  bubbleToman: number;
  bubblePercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HistoricalPortfolioPoint {
  date: string;
  jalaliDate: string;
  totalValueToman: number;
  totalCostBasisToman: number;
  pnlToman: number;
  pnlPercent: number;
}

export type MarketDayPrices = Record<string, number>;
export type MarketHistoryMap = Record<string, MarketDayPrices>;

export interface PriceData {
  usdToToman: number;
  eurToToman: number;
  gold18ToToman: number;
  worldGoldUsd?: number;
  fiatPricesToman: Record<string, number>;
  cryptoPricesToman: Record<string, number>;
  goldPricesToman: Record<string, number>;
  changes24h?: Record<string, number>;
  fetchedAt: number;
}

export interface AssetSummary {
  symbol: AssetSymbol;
  name: string;
  type: AssetType;
  totalQuantity: number;
  currentPriceToman: number;
  currentValueToman: number;
  costBasisToman: number;
  pnlToman: number;
  pnlPercent: number;
  realizedPnlToman: number;
  unrealizedPnlToman: number;
  allocationPercent: number;
  change24h?: number;
}

export interface PortfolioSummary {
  totalValueToman: number;
  totalCostBasisToman: number;
  totalPnlToman: number;
  totalPnlPercent: number;
  totalRealizedPnlToman: number;
  totalUnrealizedPnlToman: number;
  assets: AssetSummary[];
}

const currencyAssets = [
  { symbol: 'USD', name: 'دلار آمریکا', nameEn: 'US Dollar' },
  { symbol: 'EUR', name: 'یورو', nameEn: 'Euro' },
  { symbol: 'AED', name: 'درهم', nameEn: 'UAE Dirham' },
  { symbol: 'TRY', name: 'لیر ترکیه', nameEn: 'Turkish Lira' },
  { symbol: 'GBP', name: 'پوند انگلیس', nameEn: 'British Pound' },
  { symbol: 'CNY', name: 'یوان چین', nameEn: 'Chinese Yuan' },
  { symbol: 'CAD', name: 'دلار کانادا', nameEn: 'Canadian Dollar' },
  { symbol: 'AUD', name: 'دلار استرالیا', nameEn: 'Australian Dollar' },
  { symbol: 'RUB', name: 'روبل روسیه', nameEn: 'Russian Ruble' },
  { symbol: 'IQD', name: 'صد دینار عراق', nameEn: '100 Iraqi Dinar' },
  { symbol: 'MYR', name: 'رینگیت مالزی', nameEn: 'Malaysian Ringgit' },
  { symbol: 'GEL', name: 'لاری گرجستان', nameEn: 'Georgian Lari' },
  { symbol: 'AZN', name: 'منات آذربایجان', nameEn: 'Azerbaijani Manat' },
  { symbol: 'AMD', name: 'صد درام ارمنستان', nameEn: '100 Armenian Dram' },
  { symbol: 'THB', name: 'بات تایلند', nameEn: 'Thai Baht' },
  { symbol: 'OMR', name: 'ریال عمان', nameEn: 'Omani Rial' },
  { symbol: 'INR', name: 'روپیه هند', nameEn: 'Indian Rupee' },
  { symbol: 'PKR', name: 'روپیه پاکستان', nameEn: 'Pakistani Rupee' },
  { symbol: 'JPY', name: 'صد ین ژاپن', nameEn: '100 Japanese Yen' },
  { symbol: 'SAR', name: 'ریال عربستان', nameEn: 'Saudi Riyal' },
  { symbol: 'AFN', name: 'افغانی', nameEn: 'Afghan Afghani' },
  { symbol: 'SEK', name: 'کرون سوئد', nameEn: 'Swedish Krona' },
  { symbol: 'CHF', name: 'فرانک سوئیس', nameEn: 'Swiss Franc' },
  { symbol: 'QAR', name: 'ریال قطر', nameEn: 'Qatari Riyal' },
  { symbol: 'KRW', name: 'صد وون کره جنوبی', nameEn: '100 South Korean Won' },
  { symbol: 'NOK', name: 'کرون نروژ', nameEn: 'Norwegian Krone' },
  { symbol: 'NZD', name: 'دلار نیوزلند', nameEn: 'New Zealand Dollar' },
  { symbol: 'SGD', name: 'دلار سنگاپور', nameEn: 'Singapore Dollar' },
  { symbol: 'HKD', name: 'دلار هنگ کنگ', nameEn: 'Hong Kong Dollar' },
  { symbol: 'KWD', name: 'دینار کویت', nameEn: 'Kuwaiti Dinar' },
  { symbol: 'DKK', name: 'کرون دانمارک', nameEn: 'Danish Krone' },
  { symbol: 'BHD', name: 'دینار بحرین', nameEn: 'Bahraini Dinar' },
  { symbol: 'TJS', name: 'سامانی تاجیکستان', nameEn: 'Tajikistani Somoni' },
  { symbol: 'TMT', name: 'منات ترکمنستان', nameEn: 'Turkmenistani Manat' },
  { symbol: 'KGS', name: 'سوم قرقیزستان', nameEn: 'Kyrgyzstani Som' },
  { symbol: 'SYP', name: 'صد پوند سوریه', nameEn: '100 Syrian Pound' },
  { symbol: 'BRL', name: 'رئال برزیل', nameEn: 'Brazilian Real' },
  { symbol: 'ARS', name: 'پزو آرژانتین', nameEn: 'Argentine Peso' },
  { symbol: 'USD-HAV', name: 'حواله دلار آمریکا', nameEn: 'USD Remittance' },
  { symbol: 'USD-IST', name: 'دلار استانبول', nameEn: 'USD Istanbul' },
  { symbol: 'USD-SULAYMANIYAH', name: 'دلار سلیمانیه', nameEn: 'USD Sulaymaniyah' },
  { symbol: 'USD-HERAT', name: 'دلار هرات', nameEn: 'USD Herat' },
  { symbol: 'EUR-HAV', name: 'حواله یورو', nameEn: 'EUR Remittance' },
  { symbol: 'EUR-IST', name: 'یورو استانبول', nameEn: 'EUR Istanbul' },
];

const cryptoAssets = [
  { symbol: 'USDT', name: 'تتر', nameEn: 'Tether USD' },
  { symbol: 'BTC', name: 'بیت کوین', nameEn: 'Bitcoin' },
  { symbol: 'ETH', name: 'اتریوم', nameEn: 'Ethereum' },
  { symbol: 'ETC', name: 'اتریوم کلاسیک', nameEn: 'Ethereum Classic' },
  { symbol: 'XRP', name: 'ریپل', nameEn: 'XRP' },
  { symbol: 'BNB', name: 'بایننس کوین', nameEn: 'BNB Chain' },
  { symbol: 'SHIB', name: 'شیبا', nameEn: 'Shiba Inu' },
  { symbol: 'ADA', name: 'کاردانو', nameEn: 'Cardano' },
  { symbol: 'DOGE', name: 'دوج‌کوین', nameEn: 'Dogecoin' },
  { symbol: 'TON', name: 'تون کوین', nameEn: 'Toncoin' },
  { symbol: 'NOT', name: 'نات کوین', nameEn: 'Notcoin' },
  { symbol: 'SOL', name: 'سولانا', nameEn: 'Solana' },
  { symbol: 'TRX', name: 'ترون', nameEn: 'TRON' },
  { symbol: 'CAKE', name: 'پنکیک سواپ', nameEn: 'PancakeSwap' },
  { symbol: 'AVAX', name: 'آوالانچ', nameEn: 'Avalanche' },
  { symbol: 'DOT', name: 'پولکادات', nameEn: 'Polkadot' },
  { symbol: 'LINK', name: 'چین‌لینک', nameEn: 'Chainlink' },
  { symbol: 'LTC', name: 'لایت‌کوین', nameEn: 'Litecoin' },
  { symbol: 'PEPE', name: 'پپه', nameEn: 'Pepe' },
  { symbol: 'UNI', name: 'یونی‌سواپ', nameEn: 'Uniswap' },
  { symbol: 'XLM', name: 'استلار', nameEn: 'Stellar Lumens' },
  { symbol: 'FIL', name: 'فایل‌کوین', nameEn: 'Filecoin' },
  { symbol: 'NEAR', name: 'نیر پروتکل', nameEn: 'NEAR Protocol' },
  { symbol: 'EOS', name: 'ایاس', nameEn: 'EOS' },
  { symbol: 'AAVE', name: 'آوه', nameEn: 'Aave' },
  { symbol: 'GRT', name: 'گراف', nameEn: 'The Graph' },
  { symbol: 'XTZ', name: 'تزوس', nameEn: 'Tezos' },
  { symbol: 'FLOW', name: 'فلو', nameEn: 'Flow' },
  { symbol: 'SAND', name: 'سندباکس', nameEn: 'The Sandbox' },
  { symbol: 'MANA', name: 'دی‌سنترالند', nameEn: 'Decentraland' },
  { symbol: 'AXS', name: 'اکسی اینفینیتی', nameEn: 'Axie Infinity' },
  { symbol: 'CHZ', name: 'چیلیز', nameEn: 'Chiliz' },
  { symbol: 'ENJ', name: 'انجین کوین', nameEn: 'Enjin Coin' },
  { symbol: 'ZEC', name: 'زدکش', nameEn: 'Zcash' },
  { symbol: 'GALA', name: 'گالا', nameEn: 'Gala' },
  { symbol: 'LRC', name: 'لوپرینگ', nameEn: 'Loopring' },
  { symbol: 'BAT', name: 'بت', nameEn: 'Basic Attention Token' },
  { symbol: 'ONE', name: 'هارمونی', nameEn: 'Harmony' },
  { symbol: 'ZEN', name: 'هورایزن', nameEn: 'Horizen' },
  { symbol: 'CVC', name: 'سیویک', nameEn: 'Civic' },
  { symbol: 'STORJ', name: 'استورج', nameEn: 'Storj' },
];

const goldAssets = [
  { symbol: 'GOLD18', name: 'طلای ۱۸ عیار', nameEn: '18K Gold (Gram)' },
  { symbol: '18AYAR', name: 'طلای ۱۸ عیار (آلان‌چند)', nameEn: '18K Gold' },
  { symbol: 'ABSHODEH', name: 'آبشده (مثقال طلا)', nameEn: 'Melted Gold (Meqal)' },
  { symbol: 'SEKKEH', name: 'سکه امامی (طرح جدید)', nameEn: 'Emami Gold Coin' },
  { symbol: 'BAHAR', name: 'سکه بهار آزادی', nameEn: 'Bahar Azadi Coin' },
  { symbol: 'NIM', name: 'نیم سکه', nameEn: 'Half Gold Coin' },
  { symbol: 'ROB', name: 'ربع سکه', nameEn: 'Quarter Gold Coin' },
  { symbol: 'SEK', name: 'سکه گرمی', nameEn: 'Gram Gold Coin' },
  { symbol: 'USD_XAU', name: 'انس طلا (دلار)', nameEn: 'World Gold Ounce' },
  { symbol: 'XAG', name: 'انس نقره (دلار)', nameEn: 'World Silver Ounce' },
];

export const allAssets = [
  ...goldAssets.map(asset => ({ ...asset, type: 'GOLD' as AssetType })),
  ...currencyAssets.map(asset => ({ ...asset, type: 'FIAT' as AssetType })),
  ...cryptoAssets.map(asset => ({ ...asset, type: 'CRYPTO' as AssetType })),
];

const baseAssets = allAssets;

export const ASSET_DETAILS: Record<AssetSymbol, { name: string; nameEn?: string; type: AssetType }> = baseAssets.reduce((acc, asset) => {
  acc[asset.symbol] = { name: asset.name, nameEn: (asset as any).nameEn, type: asset.type };
  return acc;
}, {} as Record<AssetSymbol, { name: string; nameEn?: string; type: AssetType }>);

export const getAssetDetail = (symbol: AssetSymbol, lang: 'fa' | 'en' = 'fa'): { name: string; type: AssetType } => {
  const detail = ASSET_DETAILS[symbol];
  if (detail) {
    const displayName = (lang === 'en' && detail.nameEn) ? detail.nameEn : detail.name;
    return { name: displayName, type: detail.type };
  }
  return { name: symbol, type: 'CRYPTO' };
};
