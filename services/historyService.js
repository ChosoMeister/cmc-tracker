/**
 * Market History Synchronization Service
 * Fetches historical end-of-day prices from TGJU (fiat & gold) and Binance (crypto)
 * and keeps them cached in data/market_history.json
 */

import fs from 'fs';
import path from 'path';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Format YYYY/MM/DD to YYYY-MM-DD
function normalizeDateStr(dStr) {
    if (!dStr) return null;
    return dStr.replace(/\//g, '-').trim();
}

// Clean number string (remove commas)
function parseRialToToman(valStr) {
    if (!valStr) return 0;
    const clean = String(valStr).replace(/,/g, '').trim();
    const rial = parseFloat(clean);
    if (isNaN(rial)) return 0;
    return Math.round(rial / 10);
}

/**
 * Fetch TGJU historical indicator
 */
async function fetchTgjuHistory(indicatorSlug) {
    try {
        const url = `https://api.tgju.org/v1/market/indicator/summary-table-data/${indicatorSlug}?lang=fa`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': 'https://www.tgju.org/',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
        });
        if (!res.ok) {
            console.warn(`[TGJU History] Failed ${indicatorSlug}: HTTP ${res.status}`);
            return [];
        }
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
        console.warn(`[TGJU History] Error fetching ${indicatorSlug}:`, err.message);
        return [];
    }
}

/**
 * Fetch Binance crypto historical daily closes
 */
async function fetchBinanceDailyCloses(symbol, limit = 500) {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${limit}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json)) return [];

        // Kline: [openTime, open, high, low, close, ...]
        return json.map(item => {
            const dateObj = new Date(item[0]);
            const dateStr = dateObj.toISOString().split('T')[0];
            const closePrice = parseFloat(item[4]);
            return { dateStr, closePrice };
        });
    } catch (err) {
        console.warn(`[Binance History] Error fetching ${symbol}:`, err.message);
        return [];
    }
}

/**
 * Main function to sync and update market history
 * @param {string} dataDir Path to the persistent data folder
 */
export async function syncMarketHistory(dataDir) {
    const historyFile = path.join(dataDir, 'market_history.json');
    let historyMap = {};

    if (fs.existsSync(historyFile)) {
        try {
            historyMap = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (e) {
            historyMap = {};
        }
    }

    console.log('[HistorySync] Starting historical data sync...');

    // 1. Fetch TGJU indicators
    const tgjuTargets = [
        { slug: 'price_dollar_rl', key: 'USD' },
        { slug: 'geram18', key: 'GOLD18' },
        { slug: 'sekeb', key: 'SEKKEH' },
        { slug: 'nim', key: 'NIM' },
        { slug: 'rob', key: 'ROB' },
        { slug: 'gerami', key: 'GERAMI' },
        { slug: 'price_eur', key: 'EUR' },
        { slug: 'ons', key: 'ONS' } // World Gold USD
    ];

    for (const target of tgjuTargets) {
        try {
            const rows = await fetchTgjuHistory(target.slug);
            // Rows format: [close, open, high, low, change, changePct, dateGregorian, dateJalali]
            // We take up to 730 days (2 years)
            const recentRows = rows.slice(0, 730);
            for (const row of recentRows) {
                if (!row || row.length < 7) continue;
                const dStr = normalizeDateStr(row[6]); // e.g. "2026-09-10"
                if (!dStr) continue;

                if (!historyMap[dStr]) historyMap[dStr] = {};

                if (target.key === 'ONS') {
                    // ONS is in USD directly
                    const clean = String(row[0]).replace(/,/g, '').trim();
                    const usdVal = parseFloat(clean);
                    if (!isNaN(usdVal) && usdVal > 0) {
                        historyMap[dStr][target.key] = usdVal;
                    }
                } else {
                    const tomanPrice = parseRialToToman(row[0]);
                    if (tomanPrice > 0) {
                        historyMap[dStr][target.key] = tomanPrice;
                    }
                }
            }
            // Small delay to be polite
            await new Promise(r => setTimeout(r, 400));
        } catch (e) {
            console.warn(`[HistorySync] Error processing ${target.key}:`, e.message);
        }
    }

    // 2. Fetch Binance Crypto Closes
    const cryptoTargets = [
        { pair: 'BTCUSDT', key: 'BTC' },
        { pair: 'ETHUSDT', key: 'ETH' },
        { pair: 'ADAUSDT', key: 'ADA' },
        { pair: 'ETCUSDT', key: 'ETC' },
        { pair: 'SOLUSDT', key: 'SOL' },
        { pair: 'TONUSDT', key: 'TON' }
    ];

    for (const c of cryptoTargets) {
        try {
            const klines = await fetchBinanceDailyCloses(c.pair, 500);
            for (const item of klines) {
                if (!historyMap[item.dateStr]) historyMap[item.dateStr] = {};
                historyMap[item.dateStr][c.key] = item.closePrice;
            }
            await new Promise(r => setTimeout(r, 300));
        } catch (e) {
            console.warn(`[HistorySync] Error processing ${c.key}:`, e.message);
        }
    }

    // Sort by date ascending
    const sortedDates = Object.keys(historyMap).sort();
    const sortedMap = {};
    for (const d of sortedDates) {
        sortedMap[d] = historyMap[d];
    }

    try {
        fs.writeFileSync(historyFile, JSON.stringify(sortedMap, null, 2), 'utf8');
        console.log(`[HistorySync] Successfully synced history. Total dates: ${sortedDates.length}`);
    } catch (e) {
        console.error('[HistorySync] Failed to write history file:', e);
    }

    return sortedMap;
}

/**
 * Record today's end of day snapshot from current live prices
 */
export function recordDailySnapshot(dataDir, livePrices) {
    if (!livePrices) return;
    const historyFile = path.join(dataDir, 'market_history.json');
    let historyMap = {};

    if (fs.existsSync(historyFile)) {
        try {
            historyMap = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (e) {
            historyMap = {};
        }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!historyMap[todayStr]) historyMap[todayStr] = {};

    if (livePrices.usdToToman) historyMap[todayStr]['USD'] = livePrices.usdToToman;
    if (livePrices.gold18ToToman) historyMap[todayStr]['GOLD18'] = livePrices.gold18ToToman;
    if (livePrices.eurToToman) historyMap[todayStr]['EUR'] = livePrices.eurToToman;
    if (livePrices.worldGoldUsd) historyMap[todayStr]['ONS'] = livePrices.worldGoldUsd;

    if (livePrices.goldPricesToman) {
        Object.entries(livePrices.goldPricesToman).forEach(([k, v]) => {
            historyMap[todayStr][k] = v;
        });
    }

    if (livePrices.cryptoPricesToman && livePrices.usdToToman) {
        Object.entries(livePrices.cryptoPricesToman).forEach(([k, tomanVal]) => {
            // Convert to USD price
            historyMap[todayStr][k] = tomanVal / livePrices.usdToToman;
        });
    }

    try {
        fs.writeFileSync(historyFile, JSON.stringify(historyMap, null, 2), 'utf8');
    } catch (e) {
        console.error('[HistorySnapshot] Failed to write today snapshot:', e);
    }
}
