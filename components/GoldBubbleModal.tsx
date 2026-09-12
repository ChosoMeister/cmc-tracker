import React, { useState, useMemo } from 'react';
import { X, Sparkles, AlertCircle, Calculator, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { PriceData } from '../types';
import { calculateAllBubbles } from '../utils/goldCalculator';
import { formatNumber, formatPercent, formatToman } from '../utils/formatting';

interface GoldBubbleModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices: PriceData | null;
  onRefreshPrices?: () => void;
}

export const GoldBubbleModal: React.FC<GoldBubbleModalProps> = ({
  isOpen,
  onClose,
  prices,
  onRefreshPrices,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'simulator'>('live');

  // Simulator state
  const [simUsdRate, setSimUsdRate] = useState<string>(() => (prices?.usdToToman || 70000).toString());
  const [simOunceUsd, setSimOunceUsd] = useState<string>(() => {
    const calculated = prices?.usdToToman && prices?.gold18ToToman
      ? Math.round((prices.gold18ToToman * 31.1035) / (0.75 * prices.usdToToman))
      : 2700;
    return calculated.toString();
  });

  const parsedSimUsd = parseFloat(simUsdRate.replace(/,/g, '')) || 0;
  const parsedSimOunce = parseFloat(simOunceUsd.replace(/,/g, '')) || 0;

  const liveBubbles = useMemo(() => {
    return calculateAllBubbles(prices);
  }, [prices]);

  const simulatedBubbles = useMemo(() => {
    if (!parsedSimUsd || !parsedSimOunce) return [];
    return calculateAllBubbles(prices, parsedSimUsd, parsedSimOunce);
  }, [prices, parsedSimUsd, parsedSimOunce]);

  if (!isOpen) return null;

  const currentUsdRate = prices?.usdToToman || 70000;
  const estimatedOunceUsd = prices?.worldGoldUsd
    || (prices?.goldPricesToman?.USD_XAU ? Math.round(prices.goldPricesToman.USD_XAU / currentUsdRate) : undefined)
    || (prices?.gold18ToToman ? Math.round((prices.gold18ToToman * 31.1035) / (0.75 * currentUsdRate)) : 2700);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-2xl max-h-[90vh] rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-800 dark:text-white">
                تحلیل و محاسبه‌گر حباب طلا و سکه
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                بر اساس فرمول استاندارد ضرب مسکوکات و انس جهانی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all"
          >
            <X size={18} />
          </button>
        </header>

        {/* Sub Header / Info Bar */}
        <div className="px-5 sm:px-6 py-3 bg-amber-500/5 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 font-bold">نرخ دلار مبنا: </span>
              <span className="font-black text-slate-800 dark:text-slate-200">{formatNumber(currentUsdRate)} تومان</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold">انس طلای جهانی: </span>
              <span className="font-black text-slate-800 dark:text-slate-200">{formatNumber(estimatedOunceUsd)} دلار</span>
            </div>
          </div>
          {onRefreshPrices && (
            <button
              onClick={onRefreshPrices}
              className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:underline"
            >
              <RefreshCw size={12} />
              <span>بروزرسانی نرخ‌ها</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="px-5 sm:px-6 pt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all ${
              activeTab === 'live'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            حباب لحظه‌ای بازار
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Calculator size={14} />
            شبیه‌ساز سناریوی قیمت (دلار و انس)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-3.5 no-scrollbar">
          {activeTab === 'simulator' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft size={14} className="text-amber-500" />
                <span>اگر دلار و انس به مقادیر زیر برسند، قیمت و حباب طلا و سکه چقدر خواهد شد؟</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">
                    قیمت پیش‌بینی دلار (تومان)
                  </label>
                  <input
                    type="number"
                    value={simUsdRate}
                    onChange={(e) => setSimUsdRate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-black focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
                    placeholder="70000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">
                    قیمت پیش‌بینی انس طلا (دلار)
                  </label>
                  <input
                    type="number"
                    value={simOunceUsd}
                    onChange={(e) => setSimOunceUsd(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-black focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
                    placeholder="2700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="space-y-3">
            {(activeTab === 'live' ? liveBubbles : simulatedBubbles).map((item) => {
              const isHigh = item.riskLevel === 'HIGH';
              const isMed = item.riskLevel === 'MEDIUM';

              const badgeColor = isHigh
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : isMed
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

              const statusText = isHigh ? 'حباب بالا' : isMed ? 'حباب متوسط' : 'حباب منطقی';

              return (
                <div
                  key={item.symbol}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-800 dark:text-white">{item.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
                      <span>وزن: {item.weightGrams} گرم</span>
                      <span>•</span>
                      <span>عیار: {item.carat}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-slate-400 font-bold">ارزش ذاتی</div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {formatToman(item.intrinsicValueToman)} <span className="text-[10px] opacity-70">ت</span>
                      </div>
                    </div>

                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-slate-400 font-bold">قیمت بازار</div>
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {formatToman(item.marketPriceToman)} <span className="text-[10px] opacity-70">ت</span>
                      </div>
                    </div>

                    <div className="text-left min-w-[75px]">
                      <div className="text-[10px] text-slate-400 font-bold">حباب</div>
                      <div
                        className={`text-xs font-black ${
                          item.bubblePercent > 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {formatPercent(item.bubblePercent)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        {formatToman(Math.abs(item.bubbleToman))} ت
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span>حباب منفی به معنی قیمت پایین‌تر از ارزش طلای خام است.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all"
          >
            متوجه شدم
          </button>
        </footer>
      </div>
    </div>
  );
};
