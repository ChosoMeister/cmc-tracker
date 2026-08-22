import React, { useState, useMemo } from 'react';
import { X, Sparkles, AlertCircle, ShieldAlert, ShieldCheck, Calculator, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { PriceData } from '../types';
import { calculateAllBubbles, calculateIntrinsicValue, COIN_SPECS } from '../utils/goldCalculator';
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
  const estimatedOunceUsd = prices?.goldPricesToman?.USD_XAU
    ? Math.round(prices.goldPricesToman.USD_XAU / currentUsdRate)
    : prices?.gold18ToToman
    ? Math.round((prices.gold18ToToman * 31.1035) / (0.75 * currentUsdRate))
    : 2700;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-6 py-5 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[color:var(--muted-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-black text-lg text-[color:var(--text-primary)] flex items-center gap-2">
                تحلیل و محاسبه‌گر حباب طلا و سکه
              </h2>
              <p className="text-[11px] text-[color:var(--text-muted)] font-bold">
                بر اساس فرمول استاندارد ضرب مسکوکات و انس جهانی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-[color:var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] border border-[color:var(--border-color)] transition-all"
          >
            <X size={18} />
          </button>
        </header>

        {/* Sub Header / Info Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent border-b border-[color:var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[color:var(--text-muted)]">نرخ دلار مبنا: </span>
              <span className="font-black font-mono">{formatNumber(currentUsdRate)} تومان</span>
            </div>
            <div>
              <span className="text-[color:var(--text-muted)]">انس طلای جهانی: </span>
              <span className="font-black font-mono">${formatNumber(estimatedOunceUsd)}</span>
            </div>
          </div>
          {onRefreshPrices && (
            <button
              onClick={onRefreshPrices}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <RefreshCw size={12} />
              <span>بروزرسانی نرخ‌ها</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'live'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[color:var(--muted-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
            }`}
          >
            حباب لحظه‌ای بازار
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[color:var(--muted-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
            }`}
          >
            <Calculator size={14} />
            شبیه‌ساز سناریوی قیمت (دلار و انس)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'simulator' && (
            <div className="p-4 rounded-2xl bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] space-y-3">
              <div className="text-xs font-bold text-[color:var(--text-primary)] flex items-center gap-1.5">
                <ArrowRightLeft size={14} className="text-amber-500" />
                <span>اگر دلار و انس به مقادیر زیر برسند، قیمت و حباب سکه چقدر خواهد شد؟</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[color:var(--text-muted)] block mb-1">
                    قیمت پیش‌بینی دلار (تومان)
                  </label>
                  <input
                    type="number"
                    value={simUsdRate}
                    onChange={(e) => setSimUsdRate(e.target.value)}
                    className="w-full bg-[color:var(--card-bg)] border border-[color:var(--border-color)] rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none focus:border-amber-500"
                    placeholder="70000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[color:var(--text-muted)] block mb-1">
                    قیمت پیش‌بینی انس طلا (دلار)
                  </label>
                  <input
                    type="number"
                    value={simOunceUsd}
                    onChange={(e) => setSimOunceUsd(e.target.value)}
                    className="w-full bg-[color:var(--card-bg)] border border-[color:var(--border-color)] rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none focus:border-amber-500"
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
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                : isMed
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';

              const statusText = isHigh ? 'حباب بالا (ریسک زیاد)' : isMed ? 'حباب متوسط' : 'حباب منطقی';

              return (
                <div
                  key={item.symbol}
                  className="p-4 rounded-2xl bg-[color:var(--card-bg)] border border-[color:var(--border-color)] hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[color:var(--text-primary)]">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-[11px] text-[color:var(--text-muted)] flex items-center gap-3">
                      <span>وزن: {item.weightGrams} گرم</span>
                      <span>•</span>
                      <span>عیار: {item.carat}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[color:var(--border-color)]">
                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-[color:var(--text-muted)] font-bold">ارزش ذاتی</div>
                      <div className="text-xs font-mono font-bold text-[color:var(--text-primary)]" dir="ltr">
                        {formatToman(item.intrinsicValueToman)}
                      </div>
                    </div>

                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-[color:var(--text-muted)] font-bold">قیمت بازار</div>
                      <div className="text-xs font-mono font-black text-amber-600 dark:text-amber-400" dir="ltr">
                        {formatToman(item.marketPriceToman)}
                      </div>
                    </div>

                    <div className="text-left min-w-[80px]">
                      <div className="text-[10px] text-[color:var(--text-muted)] font-bold">حباب</div>
                      <div
                        className={`text-xs font-mono font-black ${
                          item.bubblePercent > 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                        dir="ltr"
                      >
                        {formatPercent(item.bubblePercent)}
                      </div>
                      <div className="text-[9px] text-[color:var(--text-muted)] font-mono" dir="ltr">
                        {formatToman(Math.abs(item.bubbleToman))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-[color:var(--muted-surface)] border-t border-[color:var(--border-color)] text-[11px] text-[color:var(--text-muted)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span>حباب منفی به معنی قیمت پایین‌تر از ارزش ذاتی طلای خام است.</span>
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
