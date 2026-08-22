import React, { useState, useMemo } from 'react';
import { X, Calculator, ArrowDownRight, ArrowUpRight, Sparkles, TrendingDown, Layers, HelpCircle, Check } from 'lucide-react';
import { AssetSummary, PriceData, allAssets, getAssetDetail } from '../types';
import { formatNumber, formatPercent, formatToman, formatCurrencyInput, parseCurrencyInput, toEnglishDigits } from '../utils/formatting';

interface DcaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioAssets: AssetSummary[];
  prices: PriceData | null;
}

export const DcaCalculatorModal: React.FC<DcaCalculatorModalProps> = ({
  isOpen,
  onClose,
  portfolioAssets,
  prices,
}) => {
  const defaultSymbol = portfolioAssets.length > 0 ? portfolioAssets[0].symbol : 'GOLD18';
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [newAmountToman, setNewAmountToman] = useState<string>('50,000,000');
  const [customPriceToman, setCustomPriceToman] = useState<string>('');

  const currentPriceMap: Record<string, number> = useMemo(() => {
    if (!prices) return {};
    const map: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
    };
    Object.entries(prices.fiatPricesToman || {}).forEach(([s, p]) => { map[s] = p; });
    Object.entries(prices.cryptoPricesToman || {}).forEach(([s, p]) => { map[s] = p; });
    Object.entries(prices.goldPricesToman || {}).forEach(([s, p]) => { map[s] = p; });
    return map;
  }, [prices]);

  const activeHolding = portfolioAssets.find(a => a.symbol === selectedSymbol);
  const livePrice = currentPriceMap[selectedSymbol] || activeHolding?.currentPriceToman || 0;

  const currentQty = activeHolding?.totalQuantity || 0;
  const currentCostBasis = activeHolding?.costBasisToman || 0;
  const currentAvgPrice = currentQty > 0 ? (currentCostBasis / currentQty) : livePrice;

  const simulatedPrice = parseCurrencyInput(customPriceToman) || livePrice;
  const simulatedInvestToman = parseCurrencyInput(newAmountToman);

  // New Units to buy
  const newUnits = simulatedPrice > 0 ? (simulatedInvestToman / simulatedPrice) : 0;
  const totalUnitsAfter = currentQty + newUnits;
  const totalCostBasisAfter = currentCostBasis + simulatedInvestToman;
  const newAvgPrice = totalUnitsAfter > 0 ? (totalCostBasisAfter / totalUnitsAfter) : 0;

  const avgChangePercent = currentAvgPrice > 0
    ? ((newAvgPrice - currentAvgPrice) / currentAvgPrice) * 100
    : 0;

  const assetInfo = getAssetDetail(selectedSymbol);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatCurrencyInput(val);
    setNewAmountToman(formatted);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatCurrencyInput(val);
    setCustomPriceToman(formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-lg max-h-[90vh] rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
                ماشین‌حساب هوشمند میانگین‌کم‌کنی (DCA)
              </h2>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                شبیه‌سازی خرید پله‌ای و محاسبه میانگین قیمت سر‌به‌سر جدید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
          
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 px-1">انتخاب دارایی جهت میانگین‌گیری</label>
            <select
              value={selectedSymbol}
              onChange={(e) => {
                setSelectedSymbol(e.target.value);
                setCustomPriceToman('');
              }}
              className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 dark:text-white"
            >
              {allAssets.map(a => (
                <option key={a.symbol} value={a.symbol}>
                  {a.name} ({a.symbol}) {portfolioAssets.some(p => p.symbol === a.symbol) ? '• در سبد شما' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current State Info */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400 font-bold text-[10px]">موجودی فعلی در سبد</div>
              <div className="font-black text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                {formatNumber(currentQty)} {assetInfo.name}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-bold text-[10px]">میانگین خرید فعلی</div>
              <div className="font-black text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                {currentQty > 0 ? formatToman(currentAvgPrice) : 'بدون خرید قبلی'} {currentQty > 0 && <span className="text-[10px] opacity-70">ت</span>}
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 px-1">مبلغ خرید جدید (تومان)</label>
              <input
                type="text"
                value={newAmountToman}
                onChange={handleAmountChange}
                className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                placeholder="۵۰,۰۰۰,۰۰۰"
                dir="ltr"
              />
              {/* Quick Amount Presets */}
              <div className="flex gap-1.5 pt-1">
                {[10000000, 25000000, 50000000, 100000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewAmountToman(formatCurrencyInput(val))}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    {val >= 100000000 ? `${val / 100000000}۰۰ م` : `${val / 1000000} م`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 px-1 flex items-center justify-between">
                <span>قیمت واحد خرید (تومان)</span>
                <button
                  type="button"
                  onClick={() => setCustomPriceToman(formatCurrencyInput(Math.round(livePrice)))}
                  className="text-[10px] text-blue-500 font-bold hover:underline"
                >
                  لحظه‌ای: {formatToman(livePrice)}
                </button>
              </label>
              <input
                type="text"
                value={customPriceToman}
                onChange={handlePriceChange}
                placeholder={formatCurrencyInput(Math.round(livePrice))}
                className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-400 block px-1">
                (در صورت خالی بودن، قیمت لحظه‌ای لحاظ می‌شود)
              </span>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="p-5 rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <span className="text-xs font-black text-slate-400">نتیجه شبیه‌سازی خرید جدید</span>
              <div className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles size={12} />
                <span>+ {formatNumber(newUnits)} واحد جدید</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">میانگین خرید جدید شما</span>
                <div className="text-base sm:text-lg font-black text-amber-400">
                  {formatToman(newAvgPrice)} <span className="text-xs text-slate-300 font-normal">تومان</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">تغییر میانگین قیمت</span>
                <div className={`text-base sm:text-lg font-black flex items-center gap-1 ${
                  avgChangePercent < 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {avgChangePercent < 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  <span>{formatPercent(Math.abs(avgChangePercent))}</span>
                  <span className="text-xs font-bold text-slate-300">
                    ({avgChangePercent < 0 ? 'کاهش قیمت خرید' : 'افزایش'})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">مجموع موجودی پس از خرید</span>
                <div className="text-sm font-black text-white">
                  {formatNumber(totalUnitsAfter)} {assetInfo.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">مجموع سرمایه اختصاص‌یافته</span>
                <div className="text-sm font-black text-white">
                  {formatToman(totalCostBasisAfter)} <span className="text-xs text-slate-400">ت</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/25 transition-all"
          >
            بستن ماشین‌حساب
          </button>
        </footer>

      </div>
    </div>
  );
};
