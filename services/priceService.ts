import { PriceData } from '../types';

// simulated API response from the "Server"
// We set USD to a higher value so user's 99k purchase shows as profit
const MOCK_PRICES: PriceData = {
  usdToToman: 135000, 
  eurToToman: 142000,
  gold18ToToman: 3450000,
  cryptoUsdPrices: {
    'USDT': 1.00,
    'ETH': 3850.50,
    'ADA': 0.65,
    'ETC': 32.10,
  },
  fetchedAt: Date.now(),
};

export const fetchPrices = async (): Promise<PriceData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const randomFactor = 0.995 + Math.random() * 0.01; // +/- 0.5%
  
  return {
    ...MOCK_PRICES,
    usdToToman: Math.floor(MOCK_PRICES.usdToToman * randomFactor),
    eurToToman: Math.floor(MOCK_PRICES.eurToToman * randomFactor),
    gold18ToToman: Math.floor(MOCK_PRICES.gold18ToToman * randomFactor),
    fetchedAt: Date.now(),
  };
};
