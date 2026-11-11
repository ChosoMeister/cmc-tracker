import React, { memo, useState } from 'react';
import { PortfolioSummary, PriceData } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import {
  Wallet,
  Clock,
  TrendingUp,
  TrendingDown,
  Coins,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { AnimatedToman } from './AnimatedNumber';
import { useTranslation } from '../contexts/LanguageContext';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
  prices?: PriceData | null;
}

const SummaryCardComponent: React.FC<SummaryCardProps> = ({
  summary,
  isRefreshing,
  lastUpdated,
  onRefresh,
  prices,
}) => {
  const { t, language } = useTranslation();
  const [isMasked, setIsMasked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cmc_privacy_mask') === '1';
    } catch {
      return false;
    }
  });

  const toggleMask = () => {
    setIsMasked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cmc_privacy_mask', next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const isProfit = summary.totalPnlToman >= 0;
  const hasRealized = (summary.totalRealizedPnlToman || 0) !== 0;
  const dateLocale = language === 'en' ? 'en-US' : 'fa-IR';

  const usdRate = prices?.usdToToman || 0;
  const usdChange = prices?.changes24h?.USD;
  const goldChange = prices?.changes24h?.GOLD18 ?? prices?.changes24h?.['IR_GOLD_18K'];
  const approxUsdNetWorth = usdRate > 0 ? summary.totalValueToman / usdRate : 0;

  const sourceLabel = prices?.sourceUsed
    ? prices.sourceUsed
    : language === 'en'
      ? 'Live Feed'
      : 'نرخ زنده';

  const tomanShort = language === 'en' ? 'T' : 'ت';

  return (
    <section className="relative overflow-hidden mb-6 rounded-[20px] bg-[var(--card-bg)] border border-[color:var(--border-color)] shadow-sm">
      {/* Subtle hairline top accent in Bullion Gold */}
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--brand-primary), transparent)' }}
      />

      <div className="p-5 sm:p-7">
        {/* Top Metadata & Live Feed Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3 pb-4 mb-5 border-b border-[color:var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center shrink-0">
              <Wallet size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[color:var(--text-muted)]">
                  {t('summary.netWorth')}
                </span>
                <button
                  type="button"
                  onClick={toggleMask}
                  className="p-1.5 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors"
                  title={language === 'en' ? 'Toggle Privacy Mask' : 'مخفی‌سازی / نمایش ارقام'}
                  aria-label={language === 'en' ? 'Toggle Privacy Mask' : 'مخفی‌سازی ارقام'}
                >
                  {isMasked ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap" dir="ltr">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                    isProfit
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {formatPercent(summary.totalPnlPercent, language)}
                </span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isProfit
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {isMasked
                    ? '•••,•••,•••'
                    : `${isProfit ? '+' : '-'}${formatToman(Math.abs(summary.totalPnlToman), language)} ${tomanShort}`}
                </span>
              </div>
            </div>
          </div>

          {/* Live Provenance + Timestamp + Manual Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--muted-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{sourceLabel}</span>
            </span>

            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--text-muted)] bg-[var(--muted-surface)] border border-[color:var(--border-color)] px-2.5 py-1.5 rounded-lg tabular-nums"
              dir="ltr"
            >
              <Clock size={13} />
              <span>
                {new Date(lastUpdated).toLocaleTimeString(dateLocale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-w-[38px] min-h-[38px] px-2.5 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <RefreshCw
                size={15}
                className={isRefreshing ? 'animate-spin text-[var(--brand-primary)]' : ''}
              />
              <span className="hidden sm:inline">{t('common.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Clamp-Safe Hero Net Worth (Zero Clipping on 13-digit Toman Figures) */}
        <div className={`mb-6 ${language === 'en' ? 'text-left' : 'text-right'}`}>
          <div
            className="flex flex-wrap items-baseline gap-2.5 tabular-nums leading-tight"
            dir="ltr"
            style={{ justifyContent: language === 'en' ? 'flex-start' : 'flex-end' }}
          >
            {isMasked ? (
              <span className="text-3xl sm:text-5xl font-extrabold text-[color:var(--text-primary)] tracking-tight">
                •••,•••,•••,•••
              </span>
            ) : (
              <span
                className="font-extrabold text-[color:var(--text-primary)] tracking-tight"
                style={{ fontSize: 'clamp(1.75rem, 4.2vw, 3.1rem)', lineHeight: 1.15 }}
              >
                <AnimatedToman value={summary.totalValueToman} showSuffix={false} />
              </span>
            )}
            <span className="text-base sm:text-xl font-bold text-[color:var(--text-muted)]">
              {t('common.toman')}
            </span>
            {approxUsdNetWorth > 0 && (
              <span className="text-xs sm:text-sm font-semibold text-[color:var(--text-muted)] px-2 py-0.5 rounded-lg bg-[var(--muted-surface)] tabular-nums">
                {isMasked ? '≈ $•••••' : `≈ $${formatNumber(approxUsdNetWorth, 0, 'en')}`}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Metric Strip */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            hasRealized ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          } gap-3`}
        >
          {/* Card 1: Total Cost Basis */}
          <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                {t('summary.invested')}
              </p>
              <Coins size={15} className="text-[color:var(--text-muted)]" />
            </div>
            <p className="text-[color:var(--text-primary)] font-bold text-base sm:text-lg tabular-nums" dir="ltr">
              {isMasked ? '•••,•••,•••' : formatToman(summary.totalCostBasisToman, language)}{' '}
              <span className="text-xs font-medium text-[color:var(--text-muted)]">
                {t('common.toman')}
              </span>
            </p>
          </div>

          {/* Card 2: Unrealized PnL (if realized exists) */}
          {hasRealized && (
            <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                  {t('summary.unrealizedPnl')}
                </p>
                <TrendingUp size={15} className="text-[color:var(--text-muted)]" />
              </div>
              <p
                className={`font-bold text-base sm:text-lg tabular-nums ${
                  summary.totalUnrealizedPnlToman >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
                dir="ltr"
              >
                {isMasked
                  ? '•••,•••,•••'
                  : `${summary.totalUnrealizedPnlToman >= 0 ? '+' : ''}${formatToman(
                      summary.totalUnrealizedPnlToman,
                      language
                    )}`}{' '}
                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                  {tomanShort}
                </span>
              </p>
            </div>
          )}

          {/* Card 3: Realized PnL (if realized exists) */}
          {hasRealized && (
            <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                  {t('summary.realizedPnl')}
                </p>
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p
                className={`font-bold text-base sm:text-lg tabular-nums ${
                  summary.totalRealizedPnlToman >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
                dir="ltr"
              >
                {isMasked
                  ? '•••,•••,•••'
                  : `${summary.totalRealizedPnlToman >= 0 ? '+' : ''}${formatToman(
                      summary.totalRealizedPnlToman,
                      language
                    )}`}{' '}
                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                  {tomanShort}
                </span>
              </p>
            </div>
          )}

          {/* Card 4: Live Free USD Rate (Neutral text + True semantic 24h delta badge!) */}
          <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)]">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                {t('summary.freeUsd')}
              </p>
              {typeof usdChange === 'number' && (
                <span
                  dir="ltr"
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                    usdChange >= 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {formatPercent(usdChange, language)}
                </span>
              )}
            </div>
            <p className="text-[color:var(--text-primary)] font-bold text-base sm:text-lg tabular-nums" dir="ltr">
              {formatNumber(usdRate, 0, language)}{' '}
              <span className="text-xs font-medium text-[color:var(--text-muted)]">
                {t('common.toman')}
              </span>
            </p>
          </div>

          {/* Card 5: Live 18K Gold Rate */}
          {!hasRealized && (
            <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)]">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                  {t('summary.gold18k')}
                </p>
                {typeof goldChange === 'number' && (
                  <span
                    dir="ltr"
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                      goldChange >= 0
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {formatPercent(goldChange, language)}
                  </span>
                )}
              </div>
              <p className="text-[color:var(--text-primary)] font-bold text-base sm:text-lg tabular-nums" dir="ltr">
                {formatNumber(prices?.gold18ToToman || 0, 0, language)}{' '}
                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                  {t('common.toman')}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
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
    prevProps.prices?.sourceUsed === nextProps.prices?.sourceUsed &&
    prevProps.prices?.changes24h === nextProps.prices?.changes24h
  );
});
