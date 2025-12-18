
import { GoogleGenAI } from "@google/genai";
import { PriceData } from '../types';
import { API } from './api';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_PRICES: PriceData = {
  usdToToman: 70000, 
  eurToToman: 74000,
  gold18ToToman: 4700000, 
  cryptoUsdPrices: {
    'USDT': 1.00,
    'ETH': 3450.00,
    'ADA': 0.68,
    'ETC': 26.00,
  },
  fetchedAt: Date.now(),
};

export const fetchPrices = async (): Promise<PriceData> => {
  const stored = await API.getPrices();
  return stored || DEFAULT_PRICES;
};

export const fetchLivePricesWithAI = async (): Promise<{ data: PriceData, sources: {title: string, uri: string}[] }> => {
  try {
    const now = new Date();
    const persianDate = now.toLocaleDateString('fa-IR');
    const currentTime = now.toLocaleTimeString('fa-IR');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `امروز ${persianDate} و ساعت ${currentTime} است. 
      وظیفه تو استخراج دقیق قیمت‌های لحظه‌ای از سایت‌های tgju.org و bonbast.com است.
      
      لطفا قیمت‌های زیر را پیدا کن:
      ۱. قیمت فروش نقد ۱ دلار آمریکا در بازار آزاد تهران (دقیق).
      ۲. قیمت ۱ گرم طلای ۱۸ عیار (دقت کن قیمت گرم ۱۸ را می‌خواهم نه مثقال یا سکه).
      ۳. قیمت فروش ۱ یورو در بازار آزاد.

      خروجی را فقط به صورت JSON زیر برگردان:
      {"usd": number, "gold_gram_18": number, "eur": number}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const jsonStr = response.text || "{}";
    const cleanJson = JSON.parse(jsonStr.replace(/```json|```/g, ""));
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'منبع قیمت',
        uri: chunk.web?.uri || ''
      })) || [];

    const updatedData: PriceData = {
      ...DEFAULT_PRICES,
      usdToToman: cleanJson.usd > 10000 ? cleanJson.usd : DEFAULT_PRICES.usdToToman,
      eurToToman: cleanJson.eur > 10000 ? cleanJson.eur : DEFAULT_PRICES.eurToToman,
      gold18ToToman: cleanJson.gold_gram_18 > 1000000 ? cleanJson.gold_gram_18 : DEFAULT_PRICES.gold18ToToman,
      fetchedAt: Date.now(),
    };

    await API.savePrices(updatedData);
    return { data: updatedData, sources };
  } catch (error) {
    console.error("AI Price Fetch Error:", error);
    const lastStored = await API.getPrices();
    return { data: lastStored || DEFAULT_PRICES, sources: [] };
  }
};
