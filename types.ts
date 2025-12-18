export type AssetSymbol = 'USD' | 'EUR' | 'GOLD18' | 'ADA' | 'USDT' | 'ETH' | 'ETC';
export type AssetType = 'FIAT' | 'GOLD' | 'CRYPTO';
export type Currency = 'TOMAN' | 'USD';

export interface Transaction {
  id: string;
  assetSymbol: AssetSymbol;
  quantity: number;
  buyDateTime: string; // ISO string
  buyPricePerUnit: number;
  buyCurrency: Currency;
  feesToman: number;
  note?: string;
}

export interface PriceData {
  usdToToman: number;
  eurToToman: number;
  gold18ToToman: number;
  cryptoUsdPrices: Record<string, number>;
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
  allocationPercent: number;
}

export interface PortfolioSummary {
  totalValueToman: number;
  totalCostBasisToman: number;
  totalPnlToman: number;
  totalPnlPercent: number;
  assets: AssetSummary[];
}

export const ASSET_DETAILS: Record<AssetSymbol, { name: string; type: AssetType }> = {
  USD: { name: 'دلار آمریکا', type: 'FIAT' },
  EUR: { name: 'یورو', type: 'FIAT' },
  GOLD18: { name: 'طلای ۱۸ عیار', type: 'GOLD' },
  USDT: { name: 'تتر', type: 'CRYPTO' },
  ETH: { name: 'اتریوم', type: 'CRYPTO' },
  ADA: { name: 'کاردانو', type: 'CRYPTO' },
  ETC: { name: 'اتریوم کلاسیک', type: 'CRYPTO' },
};
