import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Calendar, Database } from 'lucide-react';
import { Transaction, PriceData, MarketHistoryMap, resolveAssetSymbol } from '../types';
import { formatPercent, formatToman, formatDateCached } from '../utils/formatting';
import { API } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';

interface PortfolioHistoryChartProps {
  transactions: Transaction[];
  prices: PriceData | null;
  currentTotalValue: number;
  currentCostBasis: number;
}

type Timeframe = '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface PriceKeyframe {
  timestamp: number;
  usdToman: number;
  gold18Toman: number;
  eurToman: number;
  ethUsd: number;
  btcUsd: number;
  adaUsd: number;
}

/**
 * Historical benchmark prices for major assets (Gold 18k, USD, EUR, ETH, BTC, ADA)
 * fallback keyframes if server history is unavailable
 */
const HISTORICAL_PRICE_KEYFRAMES: PriceKeyframe[] = [
  { timestamp: new Date('2024-10-01').getTime(), usdToman: 61500, gold18Toman: 3950000, eurToman: 67000, ethUsd: 2450, btcUsd: 61000, adaUsd: 0.34 },
  { timestamp: new Date('2024-10-28').getTime(), usdToman: 66000, gold18Toman: 4350000, eurToman: 71500, ethUsd: 2520, btcUsd: 68000, adaUsd: 0.35 },
  { timestamp: new Date('2024-11-15').getTime(), usdToman: 68500, gold18Toman: 4300000, eurToman: 72500, ethUsd: 3100, btcUsd: 88000, adaUsd: 0.65 },
  { timestamp: new Date('2024-12-09').getTime(), usdToman: 71000, gold18Toman: 4104532, eurToman: 74500, ethUsd: 3900, btcUsd: 98000, adaUsd: 1.15 },
  { timestamp: new Date('2024-12-25').getTime(), usdToman: 74500, gold18Toman: 4850000, eurToman: 78000, ethUsd: 3450, btcUsd: 95000, adaUsd: 0.95 },
  { timestamp: new Date('2025-01-20').getTime(), usdToman: 83000, gold18Toman: 5750000, eurToman: 86500, ethUsd: 3300, btcUsd: 102000, adaUsd: 0.88 },
  { timestamp: new Date('2025-02-15').getTime(), usdToman: 91000, gold18Toman: 6450000, eurToman: 94000, ethUsd: 2700, btcUsd: 96000, adaUsd: 0.68 },
  { timestamp: new Date('2025-03-10').getTime(), usdToman: 96000, gold18Toman: 7100000, eurToman: 99000, ethUsd: 2150, btcUsd: 84000, adaUsd: 0.72 },
  { timestamp: new Date('2025-04-05').getTime(), usdToman: 104000, gold18Toman: 7895107, eurToman: 110000, ethUsd: 2600, btcUsd: 87000, adaUsd: 0.70 },
  { timestamp: new Date('2025-05-15').getTime(), usdToman: 92000, gold18Toman: 6950000, eurToman: 98000, ethUsd: 2800, btcUsd: 92000, adaUsd: 0.74 },
  { timestamp: new Date('2025-06-25').getTime(), usdToman: 89000, gold18Toman: 6750000, eurToman: 95000, ethUsd: 3100, btcUsd: 95000, adaUsd: 0.78 },
  { timestamp: new Date('2025-08-01').getTime(), usdToman: 98000, gold18Toman: 7900000, eurToman: 105000, ethUsd: 3700, btcUsd: 104000, adaUsd: 0.88 },
  { timestamp: new Date('2025-09-07').getTime(), usdToman: 114000, gold18Toman: 8996000, eurToman: 122000, ethUsd: 4300, btcUsd: 112000, adaUsd: 0.95 },
  { timestamp: new Date('2025-10-20').getTime(), usdToman: 106000, gold18Toman: 8350000, eurToman: 114000, ethUsd: 3850, btcUsd: 106000, adaUsd: 0.78 },
  { timestamp: new Date('2025-11-25').getTime(), usdToman: 103000, gold18Toman: 8100000, eurToman: 111000, ethUsd: 3400, btcUsd: 98000, adaUsd: 0.65 },
  { timestamp: new Date('2025-12-30').getTime(), usdToman: 122000, gold18Toman: 9600000, eurToman: 131000, ethUsd: 3600, btcUsd: 105000, adaUsd: 0.75 },
  { timestamp: new Date('2026-01-25').getTime(), usdToman: 155000, gold18Toman: 12300000, eurToman: 165000, ethUsd: 3300, btcUsd: 98000, adaUsd: 0.70 },
];

export const PortfolioHistoryChart: React.FC<PortfolioHistoryChartProps> = ({
  transactions,
  prices,
  currentTotalValue,
  currentCostBasis,
}) => {
  const { t, language } = useTranslation();
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [serverHistory, setServerHistory] = useState<MarketHistoryMap>({});
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    dateStr: string;
    jalaliStr: string;
    value: number;
    cost: number;
    profit: number;
    profitPct: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    API.getMarketHistory()
      .then((history) => {
        if (isMounted && history && Object.keys(history).length > 0) {
          setServerHistory(history);
          setIsHistoryLoaded(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedKeyframes = useMemo(() => {
    const liveUsd = prices?.usdToToman || 190000;
    const liveGold = prices?.gold18ToToman || 14000000;
    const liveEur = prices?.eurToToman || prices?.fiatPricesToman?.EUR || 205000;
    return [
      ...HISTORICAL_PRICE_KEYFRAMES,
      {
        timestamp: Date.now(),
        usdToman: liveUsd,
        gold18Toman: liveGold,
        eurToman: liveEur,
        ethUsd: 2150,
        btcUsd: 92000,
        adaUsd: 0.65,
      },
    ].sort((a, b) => a.timestamp - b.timestamp);
  }, [prices]);

  const computePriceForSymbol = useCallback(
    (symbol: string, k: PriceKeyframe, liveUsd: number): number => {
      if (symbol === 'GOLD18' || symbol === '18AYAR') return k.gold18Toman;
      if (symbol === 'ABSHODEH') return k.gold18Toman * 4.3318;
      if (symbol === 'SEKKEH' || symbol === 'BAHAR') return k.gold18Toman * 8.133 * (0.9 / 0.75) * 1.08;
      if (symbol === 'NIM') return k.gold18Toman * 4.066 * (0.9 / 0.75) * 1.15;
      if (symbol === 'ROB') return k.gold18Toman * 2.033 * (0.9 / 0.75) * 1.25;
      if (symbol === 'GRAM_COIN' || symbol === 'GERAMI') return k.gold18Toman * 1.01 * (0.9 / 0.75) * 1.3;
      if (symbol === 'USD' || symbol === 'USDT' || symbol === 'USD-HAV') return k.usdToman;
      if (symbol === 'EUR' || symbol === 'EUR-HAV') return k.eurToman;
      if (symbol === 'ETH') return k.ethUsd * k.usdToman;
      if (symbol === 'BTC') return k.btcUsd * k.usdToman;
      if (symbol === 'ADA') return k.adaUsd * k.usdToman;
      if (symbol === 'ETC') return (k.ethUsd / 100) * k.usdToman;

      const currentPrice =
        prices?.fiatPricesToman?.[symbol] ||
        prices?.cryptoPricesToman?.[symbol] ||
        prices?.goldPricesToman?.[symbol] ||
        liveUsd;
      return currentPrice * (k.usdToman / liveUsd);
    },
    [prices]
  );

  const getAssetPriceAtTime = useCallback(
    (symbol: string, time: number): number => {
      const liveUsd = prices?.usdToToman || 190000;
      const dateKey = new Date(time).toISOString().split('T')[0];

      if (serverHistory && serverHistory[dateKey]) {
        const dayData = serverHistory[dateKey];
        if ((symbol === 'GOLD18' || symbol === '18AYAR') && dayData.GOLD18) {
          return dayData.GOLD18;
        }
        if (symbol === 'ABSHODEH' && dayData.GOLD18) {
          return dayData.GOLD18 * 4.3318;
        }
        if ((symbol === 'SEKKEH' || symbol === 'BAHAR') && (dayData.SEKKEH || dayData.GOLD18)) {
          return dayData.SEKKEH || dayData.GOLD18 * 8.133 * 1.25;
        }
        if (symbol === 'NIM' && (dayData.NIM || dayData.GOLD18)) {
          return dayData.NIM || dayData.GOLD18 * 4.066 * 1.3;
        }
        if (symbol === 'ROB' && (dayData.ROB || dayData.GOLD18)) {
          return dayData.ROB || dayData.GOLD18 * 2.033 * 1.4;
        }
        if ((symbol === 'GRAM_COIN' || symbol === 'GERAMI') && (dayData.GERAMI || dayData.GRAM_COIN || dayData.GOLD18)) {
          return dayData.GERAMI || dayData.GRAM_COIN || dayData.GOLD18 * 1.01 * 1.45;
        }
        if ((symbol === 'USD' || symbol === 'USDT' || symbol === 'USD-HAV') && dayData.USD) {
          return dayData.USD;
        }
        if ((symbol === 'EUR' || symbol === 'EUR-HAV') && dayData.EUR) {
          return dayData.EUR;
        }
        if (dayData[symbol] && dayData.USD) {
          return dayData[symbol] * dayData.USD;
        }
      }

      if (time <= sortedKeyframes[0].timestamp) {
        return computePriceForSymbol(symbol, sortedKeyframes[0], liveUsd);
      }
      if (time >= sortedKeyframes[sortedKeyframes.length - 1].timestamp) {
        return computePriceForSymbol(symbol, sortedKeyframes[sortedKeyframes.length - 1], liveUsd);
      }

      let kPrev = sortedKeyframes[0];
      let kNext = sortedKeyframes[sortedKeyframes.length - 1];

      for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        if (time >= sortedKeyframes[i].timestamp && time <= sortedKeyframes[i + 1].timestamp) {
          kPrev = sortedKeyframes[i];
          kNext = sortedKeyframes[i + 1];
          break;
        }
      }

      const span = kNext.timestamp - kPrev.timestamp || 1;
      const ratio = (time - kPrev.timestamp) / span;
      const prevP = computePriceForSymbol(symbol, kPrev, liveUsd);
      const nextP = computePriceForSymbol(symbol, kNext, liveUsd);

      return prevP + (nextP - prevP) * ratio;
    },
    [serverHistory, sortedKeyframes, computePriceForSymbol, prices]
  );

  // Generate historical curve based on transactions and official market archives
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || currentTotalValue <= 0) {
      return [];
    }

    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime()
    );

    const firstTxDate = new Date(sortedTxs[0].buyDateTime);
    const now = new Date();
    let startDate = new Date(firstTxDate);
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (timeframe === '1M') {
      startDate = new Date(now.getTime() - 30 * oneDayMs);
    } else if (timeframe === '3M') {
      startDate = new Date(now.getTime() - 90 * oneDayMs);
    } else if (timeframe === '6M') {
      startDate = new Date(now.getTime() - 180 * oneDayMs);
    } else if (timeframe === '1Y') {
      startDate = new Date(now.getTime() - 365 * oneDayMs);
    }

    if (startDate < firstTxDate && timeframe !== 'ALL') {
      startDate = new Date(firstTxDate);
    }

    const totalDays = Math.max(7, Math.ceil((now.getTime() - startDate.getTime()) / oneDayMs));
    const numPoints = Math.min(50, Math.max(15, totalDays));
    const stepMs = (now.getTime() - startDate.getTime()) / (numPoints - 1);

    const points: Array<{
      date: Date;
      dateStr: string;
      jalaliStr: string;
      value: number;
      cost: number;
      profit: number;
      profitPct: number;
    }> = [];

    for (let i = 0; i < numPoints; i++) {
      const pointTime = i === numPoints - 1 ? now.getTime() : startDate.getTime() + i * stepMs;
      const d = new Date(pointTime);
      const dateStr = d.toISOString().split('T')[0];

      let runningCost = 0;
      const runningQtyMap: Record<string, number> = {};
      const costMap: Record<string, number> = {};

      sortedTxs.forEach((tx) => {
        const txTime = new Date(tx.buyDateTime).getTime();
        if (txTime <= pointTime) {
          const type = tx.type || 'BUY';
          const sym = resolveAssetSymbol(tx);
          const usdOnTxDay = getAssetPriceAtTime('USD', txTime) || prices?.usdToToman || 190000;
          const priceToman =
            tx.buyCurrency === 'TOMAN' ? tx.buyPricePerUnit : tx.buyPricePerUnit * usdOnTxDay;

          if (type === 'BUY') {
            runningQtyMap[sym] = (runningQtyMap[sym] || 0) + tx.quantity;
            costMap[sym] = (costMap[sym] || 0) + tx.quantity * priceToman + (tx.feesToman || 0);
          } else if (type === 'SELL') {
            const prevQty = runningQtyMap[sym] || 0;
            const avgBuy = prevQty > 0 ? (costMap[sym] || 0) / prevQty : priceToman;
            runningQtyMap[sym] = Math.max(0, prevQty - tx.quantity);
            costMap[sym] = Math.max(0, (costMap[sym] || 0) - tx.quantity * avgBuy);
          }
        }
      });

      runningCost = Object.values(costMap).reduce((acc, v) => acc + v, 0);

      let portfolioValAtDay = 0;
      Object.entries(runningQtyMap).forEach(([sym, qty]) => {
        if (qty > 0) {
          const unitPrice = getAssetPriceAtDayOrTime(sym, pointTime, getAssetPriceAtTime);
          portfolioValAtDay += qty * unitPrice;
        }
      });

      if (i === numPoints - 1) {
        portfolioValAtDay = currentTotalValue;
        runningCost = currentCostBasis;
      }

      const profit = portfolioValAtDay - runningCost;
      const profitPct = runningCost > 0 ? (profit / runningCost) * 100 : 0;

      points.push({
        date: d,
        dateStr,
        jalaliStr: formatDateCached(d.toISOString(), 'fa'),
        value: Math.round(portfolioValAtDay),
        cost: Math.round(runningCost),
        profit: Math.round(profit),
        profitPct,
      });
    }

    return points;
  }, [
    transactions,
    prices,
    currentTotalValue,
    currentCostBasis,
    timeframe,
    serverHistory,
    getAssetPriceAtTime,
  ]);

  const { pathD, areaD, activePoints } = useMemo(() => {
    if (chartData.length < 2) {
      return { pathD: '', areaD: '', activePoints: [] };
    }

    const values = chartData.map((p) => p.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 220;
    const padding = 20;

    const pts = chartData.map((p, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.value - minVal) / range) * (height - 2 * padding);
      return { ...p, x, y };
    });

    let curveD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      curveD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const fillD = `${curveD} L ${lastX} ${height} L ${firstX} ${height} Z`;

    return { pathD: curveD, areaD: fillD, activePoints: pts };
  }, [chartData]);

  if (!transactions || transactions.length === 0) return null;

  const isProfit = currentTotalValue >= currentCostBasis;
  const strokeColor = isProfit ? '#10b981' : '#f43f5e';
  const activeDisplay =
    hoveredPoint || (chartData.length > 0 ? chartData[chartData.length - 1] : null);

  return (
    <section className="bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-[20px] p-5 sm:p-6 shadow-sm border border-[color:var(--border-color)] space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider">
              {t('chart.portfolioGrowth')}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] inline-flex items-center gap-1">
              <Database size={12} />
              <span>
                {isHistoryLoaded ? t('chart.officialArchive') : t('chart.marketFluctuations')}
              </span>
            </span>
          </div>

          {activeDisplay && (
            <div className="flex items-baseline gap-3 flex-wrap pt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-[color:var(--text-primary)] tabular-nums" dir="ltr">
                {formatToman(activeDisplay.value, language)}{' '}
                <span className="text-xs text-[color:var(--text-muted)] font-semibold">
                  {t('common.toman')}
                </span>
              </span>
              <div
                className={`text-xs font-bold inline-flex items-center gap-1 tabular-nums ${
                  activeDisplay.profit >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
                dir="ltr"
              >
                {activeDisplay.profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatPercent(activeDisplay.profitPct, language)}</span>
                <span className="text-xs text-[color:var(--text-muted)] font-medium">
                  ({activeDisplay.profit >= 0 ? '+' : ''}
                  {formatToman(activeDisplay.profit, language)} {language === 'en' ? 'T' : 'ت'})
                </span>
              </div>
            </div>
          )}

          {activeDisplay && (
            <div className="text-xs text-[color:var(--text-muted)] font-medium flex items-center gap-1.5 flex-wrap tabular-nums">
              <Calendar size={13} />
              <span>
                {t('chart.date')}:{' '}
                {language === 'en' ? activeDisplay.dateStr : activeDisplay.jalaliStr}
              </span>
              <span>•</span>
              <span>
                {t('chart.investedCapital')}: {formatToman(activeDisplay.cost, language)}{' '}
                {t('common.toman')}
              </span>
            </div>
          )}
        </div>

        {/* Timeframe selector */}
        <div
          role="group"
          aria-label="Chart Timeframe"
          className="flex items-center gap-1 p-1 bg-[var(--muted-surface)] rounded-xl border border-[color:var(--border-color)] self-start"
        >
          {(['1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => {
            const tfLabels: Record<Timeframe, string> = {
              '1M': t('chart.oneMonth'),
              '3M': t('chart.threeMonths'),
              '6M': t('chart.sixMonths'),
              '1Y': t('chart.oneYear'),
              ALL: t('chart.all'),
            };
            const isSelected = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-[var(--card-bg)] text-[var(--brand-primary)] shadow-sm border border-[color:var(--border-color)]'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                {tfLabels[tf]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full h-[220px] overflow-hidden select-none" dir="ltr">
        <svg
          viewBox="0 0 800 220"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle Grid lines */}
          <line x1="20" y1="50" x2="780" y2="50" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
          <line x1="20" y1="110" x2="780" y2="110" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
          <line x1="20" y1="170" x2="780" y2="170" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#equityGrad)" />}

          {/* Main curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive hover columns */}
          {activePoints.map((pt, idx) => (
            <rect
              key={idx}
              x={pt.x - 10}
              y={0}
              width={20}
              height={220}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredPoint(pt)}
              onTouchStart={() => setHoveredPoint(pt)}
            />
          ))}

          {/* Active point indicator */}
          {hoveredPoint &&
            (() => {
              const pt = activePoints.find((p) => p.dateStr === hoveredPoint.dateStr);
              if (!pt) return null;
              return (
                <g>
                  <line
                    x1={pt.x}
                    y1={10}
                    x2={pt.x}
                    y2={210}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeOpacity="0.85"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5.5"
                    fill="#f59e0b"
                    stroke="#090d16"
                    strokeWidth="2"
                  />
                </g>
              );
            })()}
        </svg>
      </div>
    </section>
  );
};

function getAssetPriceAtDayOrTime(
  sym: string,
  pointTime: number,
  fn: (symbol: string, time: number) => number
): number {
  return fn(sym, pointTime);
}
