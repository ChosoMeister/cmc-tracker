
export const formatToman = (value: number): string => {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value));
};

export const formatNumber = (value: number, decimals = 2): string => {
  // اگر عدد خیلی کوچک بود اعشار بیشتری نشان بده
  const finalDecimals = value < 1 && value > 0 ? Math.max(decimals, 4) : decimals;
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: finalDecimals,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}٪`;
};

export const formatCurrencyInput = (val: string) => {
  if (!val) return "";
  const cleanVal = val.toString().replace(/,/g, "");
  if (isNaN(parseFloat(cleanVal))) return "";
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseCurrencyInput = (val: string) => {
  if (!val) return 0;
  return parseFloat(val.toString().replace(/,/g, ""));
};

export const getAssetIconUrl = (symbol: string): string => {
  switch (symbol) {
    case 'USD': return 'https://flagcdn.com/w80/us.png';
    case 'EUR': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/96px-Flag_of_Europe.svg.png';
    case 'GOLD18': return 'https://cryptologos.cc/logos/pax-gold-paxg-logo.png?v=025';
    case 'USDT': return 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025';
    case 'ETH': return 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025';
    case 'ADA': return 'https://cryptologos.cc/logos/cardano-ada-logo.png?v=025';
    case 'ETC': return 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.png?v=025';
    default: {
      const detail = getAssetDetail(symbol);
      if (detail.type === 'CRYPTO') {
        return `https://alanchand.com/assets/img/crypto/${symbol}.svg`;
      }
      return '';
    }
  }
};
import { getAssetDetail } from '../types';
