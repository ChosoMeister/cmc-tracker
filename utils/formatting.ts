export const formatToman = (value: number): string => {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value));
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
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
  // Remove non-numeric chars
  return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseCurrencyInput = (val: string) => {
  return parseFloat(val.replace(/,/g, ""));
};

export const getAssetIconUrl = (symbol: string): string => {
  switch (symbol) {
    case 'USD': return 'https://flagsapi.com/US/flat/64.png';
    case 'EUR': return 'https://flagsapi.com/EU/flat/64.png';
    case 'GOLD18': return 'https://img.icons8.com/color/96/gold-bars.png'; // Placeholder
    case 'USDT': return 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025';
    case 'ETH': return 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025';
    case 'ADA': return 'https://cryptologos.cc/logos/cardano-ada-logo.png?v=025';
    case 'ETC': return 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.png?v=025';
    default: return '';
  }
};
