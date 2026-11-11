import React, { useState, useMemo, useEffect } from 'react';
import { X, AlertCircle, Calculator, RefreshCw, ArrowRightLeft, Coins } from 'lucide-react';
import { PriceData, getAssetDetail } from '../types';
import { calculateAllBubbles } from '../utils/goldCalculator';
import { formatNumber, formatPercent, formatToman } from '../utils/formatting';
import { useTranslation } from '../contexts/LanguageContext';

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
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'live' | 'simulator'>('live');

  const [simUsdRate, setSimUsdRate] = useState<string>(() =>
    (prices?.usdToToman || 70000).toString()
  );
  const [simOunceUsd, setSimOunceUsd] = useState<string>(() => {
    const calculated =
      prices?.usdToToman && prices?.gold18ToToman
        ? Math.round((prices.gold18ToToman * 31.1035) / (0.75 * prices.usdToToman))
        : 2700;
    return calculated.toString();
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const parsedSimUsd = parseFloat(simUsdRate.replace(/,/g, '')) || 0;
  const parsedSimOunce = parseFloat(simOunceUsd.replace(/,/g, '')) || 0;

  const liveBubbles = useMemo(() => calculateAllBubbles(prices), [prices]);

  const simulatedBubbles = useMemo(() => {
    if (!parsedSimUsd || !parsedSimOunce) return [];
    return calculateAllBubbles(prices, parsedSimUsd, parsedSimOunce);
  }, [prices, parsedSimUsd, parsedSimOunce]);

  if (!isOpen) return null;

  const currentUsdRate = prices?.usdToToman || 70000;
  const estimatedOunceUsd =
    prices?.worldGoldUsd ||
    (prices?.goldPricesToman?.USD_XAU
      ? Math.round(prices.goldPricesToman.USD_XAU / currentUsdRate)
      : undefined) ||
    (prices?.gold18ToToman
      ? Math.round((prices.gold18ToToman * 31.1035) / (0.75 * currentUsdRate))
      : 2700);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('bubble.title')}
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      <div className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full sm:max-w-2xl max-h-[90vh] rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] sheet-enter">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[var(--muted-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base text-[color:var(--text-primary)]">
                {t('bubble.title')}
              </h2>
              <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
                {t('bubble.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl bg-[var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] border border-[color:var(--border-color)] flex items-center justify-center transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>

        {/* Sub Header / Info Bar */}
        <div className="px-5 py-3 bg-[var(--brand-soft)] border-b border-[color:var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-[color:var(--text-muted)] font-medium">
                {t('bubble.baseUsd')}:{' '}
              </span>
              <span className="font-bold text-[color:var(--text-primary)]">
                {formatNumber(currentUsdRate, 0, language)} {t('common.toman')}
              </span>
            </div>
            <div>
              <span className="text-[color:var(--text-muted)] font-medium">
                {t('bubble.worldOunce')}:{' '}
              </span>
              <span className="font-bold text-[color:var(--text-primary)]">
                {formatNumber(estimatedOunceUsd, 0, language)} {language === 'en' ? 'USD' : 'دلار'}
              </span>
            </div>
          </div>
          {onRefreshPrices && (
            <button
              type="button"
              onClick={onRefreshPrices}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline"
            >
              <RefreshCw size={13} />
              <span>{t('market.refreshPrices')}</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`min-h-[40px] rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'live'
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              {t('bubble.liveMarketBubble')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`min-h-[40px] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              <Calculator size={14} />
              {t('bubble.scenarioSimulator')}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
          {activeTab === 'simulator' && (
            <div className="p-4 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] space-y-3">
              <div className="text-xs font-semibold text-[color:var(--text-primary)] flex items-center gap-1.5">
                <ArrowRightLeft size={14} className="text-[var(--brand-primary)] shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Simulate coin intrinsic values under target USD & Ounce rates:'
                    : 'اگر دلار و انس جهانی به مقادیر زیر برسند، ارزش ذاتی و حباب چقدر خواهد بود؟'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-muted)] block mb-1">
                    {language === 'en'
                      ? 'Target Dollar Rate (Toman)'
                      : 'قیمت پیش‌بینی دلار (تومان)'}
                  </label>
                  <input
                    type="number"
                    value={simUsdRate}
                    onChange={(e) => setSimUsdRate(e.target.value)}
                    className="w-full min-h-[42px] bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-xl py-2 px-3.5 text-base sm:text-sm font-bold focus:outline-none focus:border-[var(--brand-primary)] text-[color:var(--text-primary)] tabular-nums"
                    placeholder="70000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[color:var(--text-muted)] block mb-1">
                    {language === 'en'
                      ? 'Target Gold Ounce (USD)'
                      : 'قیمت پیش‌بینی انس طلا (دلار)'}
                  </label>
                  <input
                    type="number"
                    value={simOunceUsd}
                    onChange={(e) => setSimOunceUsd(e.target.value)}
                    className="w-full min-h-[42px] bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-xl py-2 px-3.5 text-base sm:text-sm font-bold focus:outline-none focus:border-[var(--brand-primary)] text-[color:var(--text-primary)] tabular-nums"
                    placeholder="2700"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="space-y-2.5">
            {(activeTab === 'live' ? liveBubbles : simulatedBubbles).map((item) => {
              const isHigh = item.riskLevel === 'HIGH';
              const isMed = item.riskLevel === 'MEDIUM';

              const badgeColor = isHigh
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : isMed
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';

              const statusText = isHigh
                ? t('bubble.highBubble')
                : isMed
                  ? t('bubble.mediumBubble')
                  : t('bubble.fairBubble');
              const itemName = getAssetDetail(item.symbol, language).name || item.name;

              return (
                <div
                  key={item.symbol}
                  className="p-4 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] hover:border-[var(--brand-border)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[color:var(--text-primary)]">
                        {itemName}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-xs text-[color:var(--text-muted)] font-medium flex items-center gap-2 tabular-nums">
                      <span>
                        {t('bubble.weight')}: {formatNumber(item.weightGrams, 3, language)}{' '}
                        {language === 'en' ? 'g' : 'گرم'}
                      </span>
                      <span>•</span>
                      <span>
                        {t('bubble.carat')}: {formatNumber(item.carat, 0, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[color:var(--border-color)] tabular-nums">
                    <div className="text-start">
                      <div className="text-xs text-[color:var(--text-muted)] font-medium">
                        {t('bubble.intrinsicValue')}
                      </div>
                      <div className="text-xs font-bold text-[color:var(--text-primary)] mt-0.5" dir="ltr">
                        {formatToman(item.intrinsicValueToman, language)}{' '}
                        <span className="opacity-70">{language === 'en' ? 'T' : 'ت'}</span>
                      </div>
                    </div>

                    <div className="text-start">
                      <div className="text-xs text-[color:var(--text-muted)] font-medium">
                        {t('bubble.marketPrice')}
                      </div>
                      <div className="text-xs font-bold text-[var(--brand-primary)] mt-0.5" dir="ltr">
                        {formatToman(item.marketPriceToman, language)}{' '}
                        <span className="opacity-70">{language === 'en' ? 'T' : 'ت'}</span>
                      </div>
                    </div>

                    <div className="text-end min-w-[78px]" dir="ltr">
                      <div className="text-xs text-[color:var(--text-muted)] font-medium">
                        {t('market.bubble')}
                      </div>
                      <div
                        className={`text-xs font-extrabold ${
                          item.bubblePercent > 0
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatPercent(item.bubblePercent, language)}
                      </div>
                      <div className="text-xs text-[color:var(--text-muted)] font-medium">
                        {formatToman(Math.abs(item.bubbleToman), language)}{' '}
                        {language === 'en' ? 'T' : 'ت'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-[var(--muted-surface)] border-t border-[color:var(--border-color)] text-xs text-[color:var(--text-muted)] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-[var(--brand-primary)] shrink-0" />
            <span>
              {language === 'en'
                ? 'Negative bubble indicates price is below intrinsic raw gold melt value.'
                : 'حباب منفی به معنی قیمت پایین‌تر از ارزش طلای خام است.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-gold transition-colors"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
