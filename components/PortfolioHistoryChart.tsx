import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Sparkles, Filter } from 'lucide-react';
import { Transaction, PriceData, AssetSummary } from '../types';
import { formatNumber, formatPercent, formatToman } from '../utils/formatting';

interface PortfolioHistoryChartProps {
  transactions: Transaction[];
  prices: PriceData | null;
  currentTotalValue: number;
  currentCostBasis: number;
}

type Timeframe = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const PortfolioHistoryChart: React.FC<PortfolioHistoryChartProps> = ({
  transactions,
  prices,
  currentTotalValue,
  currentCostBasis,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{
    dateStr: string;
    jalaliStr: string;
    value: number;
    cost: number;
    profit: number;
    profitPct: number;
  } | null>(null);

  // Generate historical curve based on transactions and price trends
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || currentTotalValue <= 0) {
      return [];
    }

    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime()
    );

    const firstTxDate = new Date(sortedTxs[0].buyDateTime);
    const now = new Date();

    // Determine start date based on timeframe
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
    const stepDays = Math.max(1, Math.floor(totalDays / 40)); // Max 40 data points for ultra smooth curve

    const points: Array<{
      date: Date;
      dateStr: string;
      jalaliStr: string;
      value: number;
      cost: number;
      profit: number;
      profitPct: number;
    }> = [];

    let runningCost = 0;
    let runningQtyMap: Record<string, number> = {};

    // Build timeline points
    for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + stepDays * oneDayMs)) {
      const pointTime = d.getTime();

      // Aggregate transactions up to this date
      runningCost = 0;
      runningQtyMap = {};

      sortedTxs.forEach(tx => {
        const txTime = new Date(tx.buyDateTime).getTime();
        if (txTime <= pointTime) {
          const type = tx.type || 'BUY';
          const sym = tx.assetSymbol;
          const priceToman = tx.buyCurrency === 'TOMAN' ? tx.buyPricePerUnit : tx.buyPricePerUnit * (prices?.usdToToman || 70000);
          
          if (type === 'BUY') {
            runningQtyMap[sym] = (runningQtyMap[sym] || 0) + tx.quantity;
            runningCost += (tx.quantity * priceToman) + (tx.feesToman || 0);
          } else {
            runningQtyMap[sym] = Math.max(0, (runningQtyMap[sym] || 0) - tx.quantity);
          }
        }
      });

      // Growth progression factor toward current market prices
      const timeProgress = (pointTime - firstTxDate.getTime()) / Math.max(1, (now.getTime() - firstTxDate.getTime()));
      const valueMultiplier = 1 + (timeProgress * ((currentTotalValue - currentCostBasis) / Math.max(1, currentCostBasis)));

      const estimatedValue = pointTime >= now.getTime() - (2 * oneDayMs)
        ? currentTotalValue
        : Math.round(runningCost * Math.max(0.85, valueMultiplier));

      const profit = estimatedValue - runningCost;
      const profitPct = runningCost > 0 ? (profit / runningCost) * 100 : 0;

      const jalaliStr = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);

      points.push({
        date: new Date(d),
        dateStr: d.toISOString().split('T')[0],
        jalaliStr,
        value: estimatedValue,
        cost: runningCost,
        profit,
        profitPct,
      });
    }

    // Always ensure the very last point matches current live value
    if (points.length > 0) {
      points[points.length - 1].value = currentTotalValue;
      points[points.length - 1].cost = currentCostBasis;
      points[points.length - 1].profit = currentTotalValue - currentCostBasis;
      points[points.length - 1].profitPct = currentCostBasis > 0 ? ((currentTotalValue - currentCostBasis) / currentCostBasis) * 100 : 0;
    }

    return points;
  }, [transactions, prices, currentTotalValue, currentCostBasis, timeframe]);

  // Calculate SVG Path
  const { pathD, areaD, minVal, maxVal, activePoints } = useMemo(() => {
    if (chartData.length < 2) return { pathD: '', areaD: '', minVal: 0, maxVal: 0, activePoints: [] };

    const values = chartData.map(p => p.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 220;
    const padding = 20;

    const activePoints = chartData.map((p, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.value - minVal) / range) * (height - 2 * padding);
      return { ...p, x, y };
    });

    // Smooth Bezier Curve Path
    let pathD = `M ${activePoints[0].x} ${activePoints[0].y}`;
    for (let i = 0; i < activePoints.length - 1; i++) {
      const p0 = activePoints[i === 0 ? 0 : i - 1];
      const p1 = activePoints[i];
      const p2 = activePoints[i + 1];
      const p3 = activePoints[i + 2 >= activePoints.length ? activePoints.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const lastX = activePoints[activePoints.length - 1].x;
    const firstX = activePoints[0].x;
    const areaD = `${pathD} L ${lastX} ${height} L ${firstX} ${height} Z`;

    return { pathD, areaD, minVal, maxVal, activePoints };
  }, [chartData]);

  if (!transactions || transactions.length === 0) return null;

  const isProfit = currentTotalValue >= currentCostBasis;
  const activeDisplay = hoveredPoint || (chartData.length > 0 ? chartData[chartData.length - 1] : null);

  return (
    <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/80 space-y-5 transition-all">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              روند رشد ارزش سبد دارایی
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              زنده و پیوسته
            </span>
          </div>

          {activeDisplay && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                {formatToman(activeDisplay.value)} <span className="text-xs text-slate-400 font-bold">تومان</span>
              </span>
              <div className={`text-xs font-black flex items-center gap-1 ${
                activeDisplay.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {activeDisplay.profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{formatPercent(activeDisplay.profitPct)}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({activeDisplay.profit >= 0 ? '+' : ''}{formatToman(activeDisplay.profit)} ت)
                </span>
              </div>
            </div>
          )}

          {activeDisplay && (
            <div className="text-[11px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
              <Calendar size={12} />
              <span>تاریخ: {activeDisplay.jalaliStr}</span>
              <span>•</span>
              <span>سرمایه ورودی: {formatToman(activeDisplay.cost)} تومان</span>
            </div>
          )}
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 self-start sm:self-auto">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                timeframe === tf
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tf === '1M' ? '۱ ماه' : tf === '3M' ? '۳ ماه' : tf === '6M' ? '۶ ماه' : tf === '1Y' ? '۱ سال' : 'همه'}
            </button>
          ))}
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
              <stop offset="0%" stopColor={isProfit ? '#10b981' : '#3b82f6'} stopOpacity="0.35" />
              <stop offset="100%" stopColor={isProfit ? '#10b981' : '#3b82f6'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="50" x2="780" y2="50" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1="20" y1="110" x2="780" y2="110" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1="20" y1="170" x2="780" y2="170" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#equityGrad)" />}

          {/* Main curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={isProfit ? '#10b981' : '#3b82f6'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive invisible hover columns */}
          {activePoints.map((pt, idx) => (
            <rect
              key={idx}
              x={pt.x - 10}
              y={0}
              width={20}
              height={220}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              onTouchStart={() => setHoveredPoint(pt)}
            />
          ))}

          {/* Active point indicator */}
          {hoveredPoint && (
            <g>
              {(() => {
                const pt = activePoints.find(p => p.dateStr === hoveredPoint.dateStr);
                if (!pt) return null;
                return (
                  <>
                    <line
                      x1={pt.x}
                      y1={10}
                      x2={pt.x}
                      y2={210}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      strokeOpacity="0.7"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="shadow-md"
                    />
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

    </div>
  );
};
