
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as cheerio from 'cheerio';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { syncMarketHistory, recordDailySnapshot } from './services/historyService.js';

// Zod Validation Schemas
const usernameSchema = z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد').max(50).regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط شامل حروف، اعداد و _ باشد');
const passwordSchema = z.string().min(4, 'رمز عبور باید حداقل ۴ کاراکتر باشد').max(100);

const loginSchema = z.object({
    username: usernameSchema,
    password: passwordSchema
});

const registerSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: z.string().max(100).optional(),
    securityQuestion: z.string().min(2, 'سوال امنیتی باید حداقل ۲ کاراکتر باشد').max(200),
    securityAnswer: z.string().min(2, 'پاسخ امنیتی باید حداقل ۲ کاراکتر باشد').max(100)
});

const resetPasswordSchema = z.object({
    username: usernameSchema,
    securityAnswer: z.string().min(2).max(100),
    newPassword: passwordSchema
});

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per window
    message: { message: 'تلاش‌های زیادی انجام شد. لطفاً ۱۵ دقیقه صبر کنید.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
    message: { message: 'تعداد درخواست‌ها بیش از حد مجاز است.' }
});

const BCRYPT_ROUNDS = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy in docker/nginx
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const FALLBACK_PRICES = { usdToToman: 70000, eurToToman: 74000, gold18ToToman: 4700000 };
const ONE_HOUR_MS = 60 * 60 * 1000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh cache
const BRS_API_KEY = process.env.BRS_API_KEY || 'B77uGQj9kEfffrGK4Wu6xZnz9PGJEKBG';
const BRS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Memory Cache
let usersCache = [];
let pricesCache = null;

// اطمینان از وجود دایرکتوری داده‌ها
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data into memory on startup
try {
    if (fs.existsSync(USERS_FILE)) {
        usersCache = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
} catch (e) {
    console.error('Error loading users:', e);
    usersCache = [];
}

try {
    if (fs.existsSync(PRICES_FILE)) {
        pricesCache = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    } else {
        fs.writeFileSync(PRICES_FILE, JSON.stringify(null));
    }
} catch (e) {
    console.error('Error loading prices:', e);
    pricesCache = null;
}

if (!pricesCache) {
    pricesCache = {
        usdToToman: FALLBACK_PRICES.usdToToman,
        eurToToman: FALLBACK_PRICES.eurToToman,
        gold18ToToman: FALLBACK_PRICES.gold18ToToman,
        fiatPricesToman: {
            USD: FALLBACK_PRICES.usdToToman,
            EUR: FALLBACK_PRICES.eurToToman,
        },
        cryptoPricesToman: {
            USDT: FALLBACK_PRICES.usdToToman,
        },
        goldPricesToman: {
            GOLD18: FALLBACK_PRICES.gold18ToToman,
            '18AYAR': FALLBACK_PRICES.gold18ToToman,
        },
        fetchedAt: Date.now(),
    };

    fs.promises.writeFile(PRICES_FILE, JSON.stringify(pricesCache)).catch((err) => {
        console.error('Error initializing default prices:', err);
    });
}

const PERSIAN_DIGITS = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
};

const normalizeNumber = (value = '') => {
    const normalized = value
        .toString()
        .replace(/[۰-۹٠-٩]/g, (d) => PERSIAN_DIGITS[d] || d)
        .replace(/[٬,]/g, '')
        .replace(/[^0-9.]/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const isPricePayloadHealthy = (data) => {
    if (!data || typeof data !== 'object') return false;
    const usd = Number(data.usdToToman) || 0;
    const gold18 = Number(data.gold18ToToman) || 0;
    const fiatCount = Object.keys(data.fiatPricesToman || {}).length;
    const goldCount = Object.keys(data.goldPricesToman || {}).length;
    // Reject default 70000/4700000 placeholders or zeroed responses
    if (usd <= 0 || gold18 <= 0) return false;
    if (usd === FALLBACK_PRICES.usdToToman && gold18 === FALLBACK_PRICES.gold18ToToman && fiatCount <= 2) return false;
    return fiatCount >= 1 && goldCount >= 1;
};

const fetchBrsApiData = async () => {
    const res = await fetchWithTimeout(`https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${BRS_API_KEY}`, {
        headers: {
            'User-Agent': BRS_USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://brsapi.ir/'
        }
    }, 10000);
    if (!res.ok) throw new Error(`BrsApi HTTP error: ${res.status}`);
    const json = await res.json();
    const usdEntry = Array.isArray(json?.currency) ? json.currency.find(c => c.symbol?.toUpperCase() === 'USD') : null;
    const goldEntry = Array.isArray(json?.gold) ? json.gold.find(g => g.symbol === 'IR_GOLD_18K') : null;
    if (!usdEntry || Number(usdEntry.price) <= 0 || !goldEntry || Number(goldEntry.price) <= 0) {
        throw new Error('BrsApi returned empty or zero prices (upstream outage)');
    }
    return json;
};

const TGJU_FIAT_MAPPING = {
    USD: { key: 'price_dollar_rl', multiplier: 1 },
    EUR: { key: 'price_eur', multiplier: 1 },
    AED: { key: 'price_aed', multiplier: 1 },
    TRY: { key: 'price_try', multiplier: 1 },
    GBP: { key: 'price_gbp', multiplier: 1 },
    CNY: { key: 'price_cny', multiplier: 1 },
    CAD: { key: 'price_cad', multiplier: 1 },
    AUD: { key: 'price_aud', multiplier: 1 },
    RUB: { key: 'price_rub', multiplier: 1 },
    IQD: { key: 'price_iqd', multiplier: 100 }, // 100 Iraqi Dinar
    MYR: { key: 'price_myr', multiplier: 1 },
    GEL: { key: 'price_gel', multiplier: 1 },
    AZN: { key: 'price_azn', multiplier: 1 },
    AMD: { key: 'price_amd', multiplier: 100 }, // 100 Armenian Dram
    THB: { key: 'price_thb', multiplier: 1 },
    OMR: { key: 'price_omr', multiplier: 1 },
    INR: { key: 'price_inr', multiplier: 1 },
    PKR: { key: 'price_pkr', multiplier: 1 },
    JPY: { key: 'price_jpy', multiplier: 1 },   // Already quoted per 100 Yen in TGJU
    SAR: { key: 'price_sar', multiplier: 1 },
    AFN: { key: 'price_afn', multiplier: 1 },
    SEK: { key: 'price_sek', multiplier: 1 },
    CHF: { key: 'price_chf', multiplier: 1 },
    QAR: { key: 'price_qar', multiplier: 1 },
    KRW: { key: 'price_krw', multiplier: 100 }, // 100 South Korean Won
    NOK: { key: 'price_nok', multiplier: 1 },
    NZD: { key: 'price_nzd', multiplier: 1 },
    SGD: { key: 'price_sgd', multiplier: 1 },
    HKD: { key: 'price_hkd', multiplier: 1 },
    KWD: { key: 'price_kwd', multiplier: 1 },
    DKK: { key: 'price_dkk', multiplier: 1 },
    BHD: { key: 'price_bhd', multiplier: 1 },
    TJS: { key: 'price_tjs', multiplier: 1 },
    TMT: { key: 'price_tmt', multiplier: 1 },
    KGS: { key: 'price_kgs', multiplier: 1 },
    SYP: { key: 'price_syp', multiplier: 1 },   // Quoted per 100 SYP in TGJU
    BRL: { key: 'price_brl', multiplier: 1 },
    ARS: { key: 'price_ars', multiplier: 1 },
};

const SUPPORTED_CRYPTO_SYMBOLS = [
    'BTC', 'ETH', 'ETC', 'XRP', 'BNB', 'SHIB', 'ADA', 'DOGE', 'TON', 'NOT',
    'SOL', 'TRX', 'CAKE', 'AVAX', 'DOT', 'LINK', 'LTC', 'PEPE', 'UNI', 'XLM',
    'FIL', 'NEAR', 'EOS', 'AAVE', 'GRT', 'XTZ', 'FLOW', 'SAND', 'MANA', 'AXS',
    'CHZ', 'ENJ', 'ZEC', 'GALA', 'LRC', 'BAT', 'ONE', 'ZEN', 'CVC', 'STORJ'
];

const TGJU_CRYPTO_SLUGS = {
    BTC: 'crypto-bitcoin',
    ETH: 'crypto-ethereum',
    ETC: 'crypto-ethereum-classic',
    XRP: 'crypto-ripple',
    BNB: 'crypto-bnb',
    SHIB: 'crypto-shiba-inu',
    ADA: 'crypto-cardano',
    DOGE: 'crypto-dogecoin',
    TON: 'crypto-toncoin',
    SOL: 'crypto-solana',
    TRX: 'crypto-tron',
    CAKE: 'crypto-pancakeswap',
    AVAX: 'crypto-avalanche',
    DOT: 'crypto-polkadot',
    LINK: 'crypto-chainlink',
    LTC: 'crypto-litecoin',
    UNI: 'crypto-uniswap',
    XLM: 'crypto-stellar',
    FIL: 'crypto-filecoin',
    EOS: 'crypto-eos',
    AAVE: 'crypto-aave',
    XTZ: 'crypto-tezos',
    SAND: 'crypto-sandbox',
    MANA: 'crypto-decentraland',
    AXS: 'crypto-axie-infinity',
    CHZ: 'crypto-chiliz',
    ENJ: 'crypto-enjin-coin',
    ZEC: 'crypto-zcash',
    BAT: 'crypto-basic-attention-token',
};

const parseTgjuSignedChange = (entry) => {
    if (!entry) return 0;
    const rawPct = Number(entry.dp) || 0;
    if (rawPct === 0) return 0;
    return entry.dt === 'low' ? -Math.abs(rawPct) : Math.abs(rawPct);
};

const fetchTgjuAndBinanceFallback = async () => {
    const tgjuRes = await fetchWithTimeout('https://call1.tgju.org/ajax.json', {
        headers: {
            'User-Agent': BRS_USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.tgju.org/'
        }
    }, 12000);

    if (!tgjuRes.ok) {
        throw new Error(`TGJU Live HTTP error: ${tgjuRes.status}`);
    }

    const tgjuJson = await tgjuRes.json();
    const cur = tgjuJson?.current;
    if (!cur || typeof cur !== 'object') {
        throw new Error('TGJU payload missing current object');
    }

    const fiatPrices = {};
    const goldPrices = {};
    const cryptoPrices = {};
    const changes24h = {};

    // 1. Extract Fiat Currencies (TGJU quotes Rials -> divide by 10 for Toman)
    Object.entries(TGJU_FIAT_MAPPING).forEach(([sym, cfg]) => {
        const entry = cur[cfg.key];
        if (!entry?.p) return;
        const rial = normalizeNumber(entry.p);
        if (rial > 0) {
            const toman = Math.round((rial / 10) * cfg.multiplier);
            fiatPrices[sym] = toman;
            changes24h[sym] = parseTgjuSignedChange(entry);
        }
    });

    const usdRate = fiatPrices.USD || 0;
    const eurRate = fiatPrices.EUR || 0;

    if (usdRate <= 0) {
        throw new Error('TGJU returned zero USD rate');
    }

    // Tether in Toman from TGJU if available, else fallback to USD
    let usdtRate = usdRate;
    if (cur['crypto-tether-irr']?.p) {
        const tetherRial = normalizeNumber(cur['crypto-tether-irr'].p);
        if (tetherRial > 0) {
            usdtRate = Math.round(tetherRial / 10);
            cryptoPrices.USDT = usdtRate;
            changes24h.USDT = parseTgjuSignedChange(cur['crypto-tether-irr']);
        }
    }
    if (!cryptoPrices.USDT) {
        cryptoPrices.USDT = usdRate;
        changes24h.USDT = changes24h.USD || 0;
    }

    // 2. Extract Gold & Coins
    let gold18Rate = 0;
    let worldGoldUsd = 0;

    const mapGoldItem = (tgjuKey, symbols) => {
        const entry = cur[tgjuKey];
        if (!entry?.p) return 0;
        const rial = normalizeNumber(entry.p);
        if (rial <= 0) return 0;
        const toman = Math.round(rial / 10);
        const chg = parseTgjuSignedChange(entry);
        symbols.forEach(s => {
            goldPrices[s] = toman;
            // Avoid overwriting SEK fiat change in changes24h if Swedish Krona exists, except gold symbols
            if (s !== 'SEK' || changes24h.SEK === undefined) {
                changes24h[s] = chg;
            }
        });
        return toman;
    };

    gold18Rate = mapGoldItem('geram18', ['GOLD18', '18AYAR', 'IR_GOLD_18K']);
    mapGoldItem('geram24', ['GOLD24', 'IR_GOLD_24K']);
    mapGoldItem('mesghal', ['ABSHODEH', 'IR_GOLD_MELTED']);
    mapGoldItem('sekee', ['SEKKEH', 'EMAMI', 'IR_COIN_EMAMI']);
    mapGoldItem('sekeb', ['BAHAR', 'IR_COIN_BAHAR']);
    mapGoldItem('nim', ['NIM', 'IR_COIN_HALF']);
    mapGoldItem('rob', ['ROB', 'IR_COIN_QUARTER']);
    mapGoldItem('gerami', ['GRAM_COIN', 'SEK', 'GERAMI', 'IR_COIN_1G']);

    if (cur.gerami) {
        const geramiChg = parseTgjuSignedChange(cur.gerami);
        changes24h['IR_COIN_1G'] = geramiChg;
        changes24h['GERAMI'] = geramiChg;
        changes24h['GRAM_COIN'] = geramiChg;
    }

    if (cur.ons?.p) {
        const onsUsd = normalizeNumber(cur.ons.p);
        if (onsUsd > 0) {
            worldGoldUsd = onsUsd;
            const onsChg = parseTgjuSignedChange(cur.ons);
            goldPrices.USD_XAU = Math.round(onsUsd * usdRate);
            changes24h.XAUUSD = onsChg;
            changes24h.USD_XAU = onsChg;
        }
    }

    if (cur.silver?.p) {
        const xagUsd = normalizeNumber(cur.silver.p);
        if (xagUsd > 0) {
            goldPrices.XAG = Math.round(xagUsd * usdRate);
            changes24h.XAG = parseTgjuSignedChange(cur.silver);
        }
    }

    if (gold18Rate <= 0) {
        throw new Error('TGJU returned zero Gold 18K rate');
    }

    // 3. Extract Cryptocurrencies (Primary: Binance 24hr Ticker, Secondary: TGJU crypto fields)
    let binanceLoaded = false;
    try {
        const binRes = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/24hr', {
            headers: { 'User-Agent': BRS_USER_AGENT }
        }, 8000);

        if (binRes.ok) {
            const tickers = await binRes.json();
            if (Array.isArray(tickers)) {
                const tickerMap = new Map(tickers.map(t => [t.symbol, t]));
                SUPPORTED_CRYPTO_SYMBOLS.forEach(sym => {
                    const item = tickerMap.get(`${sym}USDT`);
                    if (!item) return;
                    const usdPrice = Number(item.lastPrice) || 0;
                    const chg = Number(item.priceChangePercent) || 0;
                    if (usdPrice > 0) {
                        const rawToman = usdPrice * usdtRate;
                        cryptoPrices[sym] = rawToman >= 100 ? Math.round(rawToman) : Number(rawToman.toFixed(4));
                        changes24h[sym] = Number(chg.toFixed(2));
                    }
                });
                binanceLoaded = Object.keys(cryptoPrices).length > 3;
            }
        }
    } catch (binErr) {
        console.warn('[PriceService] Binance 24hr fallback failed, using TGJU crypto rates:', binErr.message);
    }

    // Fill any missing cryptocurrencies from TGJU
    Object.entries(TGJU_CRYPTO_SLUGS).forEach(([sym, slug]) => {
        if (cryptoPrices[sym]) return;
        const entry = cur[slug];
        if (!entry?.p) return;
        const usdPrice = normalizeNumber(entry.p);
        if (usdPrice > 0) {
            const rawToman = usdPrice * usdtRate;
            cryptoPrices[sym] = rawToman >= 100 ? Math.round(rawToman) : Number(rawToman.toFixed(4));
            changes24h[sym] = parseTgjuSignedChange(entry);
        }
    });

    return {
        data: {
            usdToToman: usdRate,
            eurToToman: eurRate,
            gold18ToToman: gold18Rate,
            worldGoldUsd,
            fiatPricesToman: fiatPrices,
            cryptoPricesToman: cryptoPrices,
            goldPricesToman: goldPrices,
            changes24h,
            sourceUsed: binanceLoaded ? 'TGJU + Binance' : 'TGJU Live',
            fetchedAt: Date.now()
        },
        sources: [
            { title: 'شبکه اطلاع‌رسانی طلا، سکه و ارز (TGJU Live)', uri: 'https://www.tgju.org' },
            ...(binanceLoaded ? [{ title: 'نرخ جهانی رمزارزها (Binance Spot)', uri: 'https://www.binance.com' }] : [])
        ]
    };
};

const processBrsMarketRates = (brsData) => {
    const fiatPrices = {};
    const cryptoPrices = {};
    const goldPrices = {};
    const changes24h = {};

    let usdRate = FALLBACK_PRICES.usdToToman;
    let eurRate = FALLBACK_PRICES.eurToToman;
    let gold18Rate = FALLBACK_PRICES.gold18ToToman;
    let worldGoldUsd = 0;
    let usdtRate = 0;

    // 1. Process Fiat Currencies
    if (Array.isArray(brsData.currency)) {
        brsData.currency.forEach(c => {
            const sym = c.symbol?.toUpperCase();
            const price = Number(c.price) || 0;
            const change = Number(c.change_percent) || 0;
            if (sym && price > 0) {
                fiatPrices[sym] = price;
                changes24h[sym] = change;
                if (sym === 'USD') usdRate = price;
                if (sym === 'EUR') eurRate = price;
                if (sym === 'USDT_IRT') usdtRate = price;
            }
        });
    }

    if (!usdtRate && fiatPrices.USD) {
        usdtRate = fiatPrices.USD;
    }

    // 2. Process Gold & Coins
    if (Array.isArray(brsData.gold)) {
        brsData.gold.forEach(g => {
            const sym = g.symbol;
            const price = Number(g.price) || 0;
            const change = Number(g.change_percent) || 0;

            if (sym === 'XAUUSD') {
                worldGoldUsd = price;
                changes24h['XAUUSD'] = change;
                changes24h['USD_XAU'] = change;
                goldPrices['USD_XAU'] = Math.round(price * usdRate);
                return;
            }

            if (price > 0) {
                goldPrices[sym] = price;
                changes24h[sym] = change;

                // Map to cmc-tracker symbols
                if (sym === 'IR_GOLD_18K') {
                    gold18Rate = price;
                    goldPrices['GOLD18'] = price;
                    goldPrices['18AYAR'] = price;
                    changes24h['GOLD18'] = change;
                    changes24h['18AYAR'] = change;
                } else if (sym === 'IR_GOLD_24K') {
                    goldPrices['GOLD24'] = price;
                    changes24h['GOLD24'] = change;
                } else if (sym === 'IR_GOLD_MELTED') {
                    goldPrices['ABSHODEH'] = price;
                    changes24h['ABSHODEH'] = change;
                } else if (sym === 'IR_COIN_EMAMI') {
                    goldPrices['SEKKEH'] = price;
                    goldPrices['EMAMI'] = price;
                    changes24h['SEKKEH'] = change;
                    changes24h['EMAMI'] = change;
                } else if (sym === 'IR_COIN_BAHAR') {
                    goldPrices['BAHAR'] = price;
                    changes24h['BAHAR'] = change;
                } else if (sym === 'IR_COIN_HALF') {
                    goldPrices['NIM'] = price;
                    changes24h['NIM'] = change;
                } else if (sym === 'IR_COIN_QUARTER') {
                    goldPrices['ROB'] = price;
                    changes24h['ROB'] = change;
                } else if (sym === 'IR_COIN_1G') {
                    goldPrices['GRAM_COIN'] = price;
                    goldPrices['GERAMI'] = price;
                    goldPrices['SEK'] = price;
                    changes24h['GRAM_COIN'] = change;
                    changes24h['GERAMI'] = change;
                    if (changes24h['SEK'] === undefined) changes24h['SEK'] = change;
                }
            }
        });
    }

    // 3. Process Cryptocurrencies
    const cryptoUsdMultiplier = usdtRate || usdRate;
    if (Array.isArray(brsData.cryptocurrency)) {
        brsData.cryptocurrency.forEach(cr => {
            const sym = cr.symbol?.toUpperCase();
            const usdPrice = Number(cr.price) || 0;
            const change = Number(cr.change_percent) || 0;

            if (sym && usdPrice > 0) {
                const tomanPrice = sym === 'USDT'
                    ? cryptoUsdMultiplier
                    : Math.round(usdPrice * cryptoUsdMultiplier);
                cryptoPrices[sym] = tomanPrice;
                changes24h[sym] = change;
            }
        });
    }

    if (!cryptoPrices['USDT'] && cryptoUsdMultiplier) {
        cryptoPrices['USDT'] = cryptoUsdMultiplier;
    }

    return {
        usdToToman: usdRate,
        eurToToman: eurRate,
        gold18ToToman: gold18Rate,
        worldGoldUsd,
        fiatPricesToman: fiatPrices,
        cryptoPricesToman: cryptoPrices,
        goldPricesToman: goldPrices,
        changes24h,
        sourceUsed: 'BrsApi.ir',
        fetchedAt: Date.now()
    };
};

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use('/api', apiLimiter);
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
        if (
            filePath.endsWith('.html') ||
            filePath.endsWith('manifest.json') ||
            filePath.endsWith('apple-touch-icon.png') ||
            filePath.endsWith('pwa-192x192.png') ||
            filePath.endsWith('pwa-512x512.png') ||
            filePath.endsWith('favicon.png')
        ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

const getUsers = () => {
    return usersCache;
};

const saveUsers = async (users) => {
    usersCache = users; // Update Memory Immediately
    try {
        await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users to disk:', e);
    }
};

const refreshAdmin = async () => {
    let users = [...getUsers()]; // Clone to avoid mutation issues
    let adminIdx = users.findIndex(u => u.username === ADMIN_USER);
    let changed = false;

    if (adminIdx === -1) {
        users.push({
            username: ADMIN_USER,
            passwordHash: ADMIN_PASS,
            isAdmin: true,
            displayName: 'ادمین سیستم',
            createdAt: new Date(),
            transactions: [],
            securityQuestion: 'کلمه عبور پیش‌فرض ادمین؟',
            securityAnswerHash: ADMIN_PASS
        });
        changed = true;
    } else {
        if (users[adminIdx].passwordHash !== ADMIN_PASS || !users[adminIdx].isAdmin) {
            users[adminIdx].passwordHash = ADMIN_PASS;
            users[adminIdx].isAdmin = true;
            changed = true;
        }
        if (!users[adminIdx].displayName) {
            users[adminIdx].displayName = 'ادمین سیستم';
            changed = true;
        }
        if (!users[adminIdx].securityQuestion) {
            users[adminIdx].securityQuestion = 'کلمه عبور پیش‌فرض ادمین؟';
            changed = true;
        }
        if (!users[adminIdx].securityAnswerHash) {
            users[adminIdx].securityAnswerHash = ADMIN_PASS;
            changed = true;
        }
    }

    if (changed) await saveUsers(users);
};
refreshAdmin();

// ساده‌ترین مسیر برای ارسال لاگ‌های سمت کلاینت به لاگ‌های داکر
app.post('/api/logs', (req, res) => {
    const { level = 'info', message = '', context = {} } = req.body || {};
    const logLine = `[ClientLog][${level.toUpperCase()}] ${message}`;

    if (level === 'error' || level === 'warn') {
        console.error(logLine, context);
    } else {
        console.log(logLine, context);
    }

    res.json({ success: true });
});

// API Endpoints
app.post('/api/login', authLimiter, async (req, res) => {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password } = validation.data;
    username = username.toLowerCase();
    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // Check if password is hashed (bcrypt hashes start with $2)
    const isHashed = user.passwordHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        // Compare with bcrypt
        isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
        // Legacy plain text comparison (for migration)
        isMatch = user.passwordHash === password;

        // Migrate legacy password to bcrypt hash
        if (isMatch) {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const userIndex = users.findIndex(u => u.username === username);
            users[userIndex] = { ...users[userIndex], passwordHash: hashedPassword };
            await saveUsers(users);
            console.log(`[Security] Migrated password for user: ${username}`);
        }
    }

    if (isMatch) {
        return res.json({
            username: user.username,
            isAdmin: !!user.isAdmin,
            displayName: user.displayName || user.username
        });
    }

    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.post('/api/register', authLimiter, async (req, res) => {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password, displayName, securityQuestion, securityAnswer } = validation.data;
    username = username.toLowerCase();
    let users = [...getUsers()];

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'نام کاربری تکراری است' });
    }

    // Hash password and security answer
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), BCRYPT_ROUNDS);

    const newUser = {
        username,
        passwordHash: hashedPassword,
        displayName: displayName || username,
        createdAt: new Date(),
        transactions: [],
        isAdmin: false,
        securityQuestion,
        securityAnswerHash: hashedSecurityAnswer
    };

    users.push(newUser);
    await saveUsers(users);
    console.log(`[Security] New user registered with hashed credentials: ${username}`);
    res.json({ username: newUser.username, isAdmin: false, displayName: newUser.displayName });
});

app.get('/api/security-question', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.json({ securityQuestion: user.securityQuestion || 'سوال امنیتی ثبت نشده است' });
});

app.post('/api/reset-password', authLimiter, async (req, res) => {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, securityAnswer, newPassword } = validation.data;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    const user = users[userIndex];
    if (!user.securityAnswerHash) {
        return res.status(400).json({ message: 'سوال امنیتی ثبت نشده است' });
    }

    // Check if security answer is hashed
    const isHashed = user.securityAnswerHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        isMatch = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswerHash);
    } else {
        // Legacy plain text comparison
        isMatch = user.securityAnswerHash.toLowerCase() === securityAnswer.toLowerCase();
    }

    if (!isMatch) {
        return res.status(401).json({ message: 'پاسخ امنیتی اشتباه است' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    users[userIndex] = { ...user, passwordHash: hashedPassword };
    await saveUsers(users);
    console.log(`[Security] Password reset for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    res.json(getUsers().map(u => ({
        username: u.username,
        createdAt: u.createdAt,
        txCount: u.transactions.length,
        isAdmin: !!u.isAdmin,
        displayName: u.displayName || u.username
    })));
});

app.post('/api/users/delete', async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase();
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    await saveUsers(getUsers().filter(u => u.username !== username));
    res.json({ success: true });
});

app.post('/api/users/update-pass', async (req, res) => {
    let { username, newPassword } = req.body;

    // Validate password
    const passValidation = passwordSchema.safeParse(newPassword);
    if (!passValidation.success) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
    }

    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    users[userIndex] = { ...users[userIndex], passwordHash: hashedPassword };
    await saveUsers(users);
    console.log(`[Security] Password updated for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    res.json(user ? user.transactions : []);
});

app.post('/api/transactions', async (req, res) => {
    let { username, transaction } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        // Create a copy of the user to update
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        const idx = user.transactions.findIndex(t => t.id === transaction.id);

        if (idx > -1) user.transactions[idx] = transaction;
        else user.transactions.push(transaction);

        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.post('/api/transactions/delete', async (req, res) => {
    let { username, id } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        user.transactions = user.transactions.filter(t => t.id !== id);
        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.post('/api/transactions/bulk', async (req, res) => {
    let { username, transactions: incoming, mode = 'merge' } = req.body || {};
    if (!username || !Array.isArray(incoming)) {
        return res.status(400).json({ message: 'Invalid bulk transactions payload' });
    }
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex > -1) {
        const current = mode === 'replace' ? [] : [...users[userIndex].transactions];
        const byId = new Map(current.map(t => [t.id, t]));
        incoming.forEach(tx => {
            if (tx && tx.id) byId.set(tx.id, tx);
        });
        users[userIndex] = { ...users[userIndex], transactions: Array.from(byId.values()) };
        await saveUsers(users);
    }
    res.json({ success: true });
});

const refreshMarketPricesOrchestrated = async () => {
    let priceData = null;
    let sources = [];
    let sourceUsed = 'BrsApi.ir';

    // Tier 1: BrsApi.ir
    try {
        const brsRaw = await fetchBrsApiData();
        const candidate = processBrsMarketRates(brsRaw);
        if (!isPricePayloadHealthy(candidate)) {
            throw new Error('Processed BrsApi payload failed health check');
        }
        priceData = candidate;
        sources = [{ title: 'وب‌سرویس جامع طلا، ارز و کریپتو (BrsApi)', uri: 'https://brsapi.ir' }];
    } catch (brsErr) {
        console.warn('[PriceService] Tier 1 (BrsApi) failed:', brsErr.message);

        // Tier 2: TGJU Live + Binance 24hr Ticker
        try {
            const fallbackResult = await fetchTgjuAndBinanceFallback();
            if (!isPricePayloadHealthy(fallbackResult.data)) {
                throw new Error('TGJU fallback payload failed health check');
            }
            priceData = fallbackResult.data;
            sources = fallbackResult.sources;
            sourceUsed = 'TGJU Live + Binance (Fallback)';
            console.log(`[PriceService] Recovered live rates via Tier 2 (${sourceUsed}). USD=${priceData.usdToToman}, GOLD18=${priceData.gold18ToToman}`);
        } catch (fallbackErr) {
            console.error('[PriceService] Tier 2 (TGJU/Binance) failed:', fallbackErr.message);

            // Tier 3: Healthy local cache (without resetting fetchedAt, so retry stays open)
            if (isPricePayloadHealthy(pricesCache)) {
                priceData = pricesCache;
                sourceUsed = 'Local Cache (Stale Fallback)';
                sources = [{ title: 'کش محلی سرور (آخرین نرخ معتبر)', uri: '#' }];
            } else {
                throw fallbackErr;
            }
        }
    }

    if (isPricePayloadHealthy(priceData) && sourceUsed !== 'Local Cache (Stale Fallback)') {
        pricesCache = priceData;
        try {
            await fs.promises.writeFile(PRICES_FILE, JSON.stringify(priceData, null, 2));
            recordDailySnapshot(DATA_DIR, priceData);
        } catch (err) {
            console.error('Error persisting refreshed prices:', err);
        }
    }

    return { priceData, sources, sourceUsed };
};

// Auto-heal corrupted/placeholder cache on server startup
if (!isPricePayloadHealthy(pricesCache)) {
    refreshMarketPricesOrchestrated()
        .then(({ sourceUsed }) => console.log(`[PriceService] Initial startup price warm-up succeeded via ${sourceUsed}`))
        .catch((err) => console.warn('[PriceService] Initial startup price warm-up failed:', err.message));
}

app.get('/api/prices', async (req, res) => {
    if (!isPricePayloadHealthy(pricesCache)) {
        try {
            await refreshMarketPricesOrchestrated();
        } catch (e) {
            // Serve whatever cache exists if all live sources are unreachable
        }
    }
    res.json(pricesCache);
});

app.get('/api/prices/refresh', async (req, res) => {
    try {
        const now = Date.now();
        const force = req.query.force === 'true';
        if (
            !force &&
            isPricePayloadHealthy(pricesCache) &&
            pricesCache?.fetchedAt &&
            now - pricesCache.fetchedAt < CACHE_TTL_MS
        ) {
            return res.json({
                success: true,
                data: pricesCache,
                skipped: true,
                nextAllowedAt: pricesCache.fetchedAt + CACHE_TTL_MS,
                message: 'آخرین بروزرسانی کمتر از ۱۵ دقیقه پیش انجام شده است',
            });
        }

        const { priceData, sources, sourceUsed } = await refreshMarketPricesOrchestrated();

        res.json({
            success: true,
            data: priceData,
            sourceUsed,
            sources,
            nextAllowedAt: (sourceUsed === 'Local Cache (Stale Fallback)' ? now : priceData.fetchedAt) + CACHE_TTL_MS,
        });
    } catch (error) {
        console.error('Error refreshing prices:', error);
        res.status(500).json({ message: 'بروزرسانی قیمت‌ها از تمامی منابع با خطا مواجه شد' });
    }
});

app.post('/api/prices', async (req, res) => {
    if (!isPricePayloadHealthy(req.body)) {
        return res.json({ success: false, skipped: true, reason: 'Unhealthy or placeholder price payload ignored' });
    }
    pricesCache = req.body;
    try {
        await fs.promises.writeFile(PRICES_FILE, JSON.stringify(req.body, null, 2));
        recordDailySnapshot(DATA_DIR, req.body);
    } catch (e) {
        console.error('Error saving prices:', e);
    }
    res.json({ success: true });
});

// ================= MARKET HISTORY ENDPOINTS =================
const HISTORY_FILE = path.join(DATA_DIR, 'market_history.json');

app.get('/api/history', async (req, res) => {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            // Trigger initial sync in background if missing
            syncMarketHistory(DATA_DIR).catch(err => console.error('Background sync failed:', err));
            return res.json({});
        }
        const data = await fs.promises.readFile(HISTORY_FILE, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        console.error('Error serving market history:', err);
        res.status(500).json({ error: 'Failed to read market history' });
    }
});

app.post('/api/history/sync', async (req, res) => {
    try {
        const synced = await syncMarketHistory(DATA_DIR);
        res.json({ success: true, count: Object.keys(synced).length });
    } catch (err) {
        console.error('Error syncing market history:', err);
        res.status(500).json({ error: 'Sync failed: ' + err.message });
    }
});

// SPA Routing: ارسال تمام درخواست‌های ناشناخته به ایندکس
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
