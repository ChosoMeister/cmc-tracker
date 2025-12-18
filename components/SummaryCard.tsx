import React from 'react';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent } from '../utils/formatting';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isRefreshing, lastUpdated, onRefresh }) => {
  const isProfit = summary.totalPnlToman >= 0;

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden mb-2">
      {/* Decorative gradient blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/10 blur-3xl rounded-full"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <span className="text-slate-400 text-xs font-bold tracking-wide">ارزش کل دارایی‌ها</span>
          </div>
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-90 ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
          >
            <RefreshCw size={16} className="text-slate-300" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-2" dir="rtl">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {formatToman(summary.totalValueToman)}
            </h1>
            <span className="text-lg text-slate-500 font-medium mb-1">تومان</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 ${isProfit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`} dir="ltr">
            {formatPercent(summary.totalPnlPercent)}
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-sm font-medium border border-white/5 bg-white/5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`} dir="rtl">
            {isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[10px] opacity-70">تومان</span>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest" dir="ltr">
            LAST UPDATE: {new Date(lastUpdated).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="flex -space-x-1 rtl:space-x-reverse">
             <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-blue-500"></div>
             <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-emerald-500"></div>
             <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-amber-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};