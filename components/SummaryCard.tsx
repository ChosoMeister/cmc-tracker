import React, { memo } from 'react';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import { Wallet, Clock, TrendingUp, TrendingDown, DollarSign, Coins, CheckCircle2 } from 'lucide-react';
import { AnimatedToman, AnimatedPercent } from './AnimatedNumber';
import { useTranslation } from '../contexts/LanguageContext';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
  prices?: any;
}

const SummaryCardComponent: React.FC<SummaryCardProps> = ({ summary, isRefreshing, lastUpdated, onRefresh, prices }) => {
  const { t, language } = useTranslation();
  const isProfit = summary.totalPnlToman >= 0;
  const hasRealized = (summary.totalRealizedPnlToman || 0) !== 0;

  const dateLocale = language === 'en' ? 'en-US' : 'fa-IR';

  return (
    <div className="relative overflow-hidden mb-6 rounded-[28px] sm:rounded-[36px] border border-slate-200/80 dark:border-slate-800/80 shadow-xl dark:shadow-2xl transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-slate-50/70 to-blue-50/30 dark:from-slate-900/90 dark:via-[#0b1224]/80 dark:to-blue-950/20 backdrop-blur-2xl transition-colors duration-300"></div>
      <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] sm:w-[600px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

      <div className="relative z-10 p-5 sm:p-8">
        
        {/* Top Bar inside Card */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`p-3 sm:p-3.5 rounded-2xl ${
              isProfit 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
            }`}>
              <Wallet size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider block">
                {t('summary.netWorth')}
              </span>
              <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg ${
                  isProfit 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {formatPercent(summary.totalPnlPercent, language)}
                </span>
                <span className={`text-xs font-black ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isProfit ? '+' : '-'}{formatToman(Math.abs(summary.totalPnlToman), language)} {language === 'en' ? 'T' : 'ت'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-full" dir="ltr">
            <Clock size={13} />
            <span>{new Date(lastUpdated).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })} • {new Date(lastUpdated).toLocaleDateString(dateLocale)}</span>
          </div>
        </div>

        {/* Hero Big Value Display */}
        <div className={`text-center ${language === 'en' ? 'sm:text-left' : 'sm:text-right'} mb-8`}>
          <div className="inline-block">
            <div className={`text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm flex items-baseline justify-center ${language === 'en' ? 'sm:justify-start' : 'sm:justify-start'} gap-2`} dir="ltr">
              <AnimatedToman value={summary.totalValueToman} showSuffix={false} />
              <span className="text-xl sm:text-3xl text-slate-400 dark:text-slate-500 font-black">
                {t('common.toman')}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasRealized ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
          
          {/* Card 1: Total Cost Basis */}
          <div className="bg-white/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{t('summary.invested')}</p>
              <Coins size={16} className="text-slate-400" />
            </div>
            <p className="text-slate-800 dark:text-slate-100 font-black text-lg sm:text-xl">
              {formatToman(summary.totalCostBasisToman, language)} <span className="text-xs text-slate-400">{t('common.toman')}</span>
            </p>
          </div>

          {/* Card 2: Unrealized PnL */}
          {hasRealized && (
            <div className="bg-white/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{t('summary.unrealizedPnl')}</p>
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <p className={`font-black text-lg sm:text-xl ${summary.totalUnrealizedPnlToman >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.totalUnrealizedPnlToman >= 0 ? '+' : ''}{formatToman(summary.totalUnrealizedPnlToman, language)} <span className="text-xs text-slate-400">{language === 'en' ? 'T' : 'ت'}</span>
              </p>
            </div>
          )}

          {/* Card 3: Realized PnL */}
          {hasRealized && (
            <div className="bg-white/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{t('summary.realizedPnl')}</p>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className={`font-black text-lg sm:text-xl ${summary.totalRealizedPnlToman >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {summary.totalRealizedPnlToman >= 0 ? '+' : ''}{formatToman(summary.totalRealizedPnlToman, language)} <span className="text-xs text-slate-400">{language === 'en' ? 'T' : 'ت'}</span>
              </p>
            </div>
          )}

          {/* Card 4: Live Dollar Rate */}
          <div className="bg-white/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{t('summary.freeUsd')}</p>
              <div className="flex items-center gap-1.5">
                {typeof prices?.changes24h?.USD === 'number' && (
                  <span
                    dir="ltr"
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      prices.changes24h.USD >= 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                    title={language === 'en' ? '24h USD Change' : 'تغییرات ۲۴ ساعته دلار'}
                  >
                    {prices.changes24h.USD >= 0 ? '+' : ''}{formatPercent(prices.changes24h.USD, language)}
                  </span>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-xl" dir="ltr">
              {formatNumber(prices?.usdToToman || 0, 0, language)} <span className="text-xs text-slate-400">{t('common.toman')}</span>
            </p>
          </div>

          {/* Card 5: Live 18K Gold Rate */}
          {!hasRealized && (
            <div className="bg-white/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">{t('summary.gold18k')}</p>
                <div className="flex items-center gap-1.5">
                  {typeof (prices?.changes24h?.GOLD18 ?? prices?.changes24h?.['IR_GOLD_18K']) === 'number' && (
                    <span
                      dir="ltr"
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        (prices.changes24h.GOLD18 ?? prices.changes24h['IR_GOLD_18K']) >= 0
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                      title={language === 'en' ? '24h Gold Change' : 'تغییرات ۲۴ ساعته طلا'}
                    >
                      {(prices.changes24h.GOLD18 ?? prices.changes24h['IR_GOLD_18K']) >= 0 ? '+' : ''}
                      {formatPercent(prices.changes24h.GOLD18 ?? prices.changes24h['IR_GOLD_18K'], language)}
                    </span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                </div>
              </div>
              <p className="text-amber-600 dark:text-amber-400 font-black text-lg sm:text-xl" dir="ltr">
                {formatNumber(prices?.gold18ToToman || 0, 0, language)} <span className="text-xs text-slate-400">{t('common.toman')}</span>
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export const SummaryCard = memo(SummaryCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.summary.totalValueToman === nextProps.summary.totalValueToman &&
    prevProps.summary.totalPnlToman === nextProps.summary.totalPnlToman &&
    prevProps.summary.totalRealizedPnlToman === nextProps.summary.totalRealizedPnlToman &&
    prevProps.isRefreshing === nextProps.isRefreshing &&
    prevProps.lastUpdated === nextProps.lastUpdated &&
    prevProps.prices?.usdToToman === nextProps.prices?.usdToToman &&
    prevProps.prices?.gold18ToToman === nextProps.prices?.gold18ToToman &&
    prevProps.prices?.changes24h === nextProps.prices?.changes24h
  );
});
