import React, { useState, useMemo, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Layers, Zap } from 'lucide-react';
import { AssetSummary, PriceData, allAssets, getAssetDetail } from '../types';
import {
  formatNumber,
  formatPercent,
  formatToman,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../utils/formatting';
import { useTranslation } from '../contexts/LanguageContext';

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
  const { t, language } = useTranslation();
  const defaultSymbol = portfolioAssets.length > 0 ? portfolioAssets[0].symbol : 'GOLD18';
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [newAmountToman, setNewAmountToman] = useState<string>('50,000,000');
  const [customPriceToman, setCustomPriceToman] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const currentPriceMap: Record<string, number> = useMemo(() => {
    if (!prices) return {};
    const map: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
      ...prices.fiatPricesToman,
      ...prices.cryptoPricesToman,
      ...prices.goldPricesToman,
    };
    return map;
  }, [prices]);

  if (!isOpen) return null;

  const activeHolding = portfolioAssets.find((a) => a.symbol === selectedSymbol);
  const livePrice = currentPriceMap[selectedSymbol] || activeHolding?.currentPriceToman || 0;

  const currentQty = activeHolding?.totalQuantity || 0;
  const currentCostBasis = activeHolding?.costBasisToman || 0;
  const currentAvgPrice = currentQty > 0 ? currentCostBasis / currentQty : livePrice;

  const simulatedPrice = parseCurrencyInput(customPriceToman) || livePrice;
  const simulatedInvestToman = parseCurrencyInput(newAmountToman);

  const newUnits = simulatedPrice > 0 ? simulatedInvestToman / simulatedPrice : 0;
  const totalUnitsAfter = currentQty + newUnits;
  const totalCostBasisAfter = currentCostBasis + simulatedInvestToman;
  const newAvgPrice = totalUnitsAfter > 0 ? totalCostBasisAfter / totalUnitsAfter : 0;

  const avgChangePercent =
    currentAvgPrice > 0 ? ((newAvgPrice - currentAvgPrice) / currentAvgPrice) * 100 : 0;

  const assetInfo = getAssetDetail(selectedSymbol, language);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('dca.title')}
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      <div className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full sm:max-w-lg max-h-[90vh] rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] sheet-enter">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[var(--muted-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
              <Layers size={19} />
            </div>
            <div>
              <h2 className="font-bold text-base text-[color:var(--text-primary)]">
                {t('dca.title')}
              </h2>
              <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
                {t('dca.subtitle')}
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
              {t('dca.selectAsset')}
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => {
                setSelectedSymbol(e.target.value);
                setCustomPriceToman('');
              }}
              className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)]"
            >
              {allAssets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {getAssetDetail(a.symbol, language).name} ({a.symbol}){' '}
                  {portfolioAssets.some((p) => p.symbol === a.symbol)
                    ? language === 'en'
                      ? '• In Portfolio'
                      : '• در سبد شما'
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current State Info */}
          <div className="p-4 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[color:var(--text-muted)] font-medium text-xs">
                {t('dca.currentHoldings')}
              </div>
              <div className="font-bold text-[color:var(--text-primary)] text-sm mt-1 tabular-nums" dir="ltr">
                {formatNumber(currentQty, 3, language)} {assetInfo.name}
              </div>
            </div>
            <div>
              <div className="text-[color:var(--text-muted)] font-medium text-xs">
                {t('dca.currentAvgPrice')}
              </div>
              <div className="font-bold text-[color:var(--text-primary)] text-sm mt-1 tabular-nums" dir="ltr">
                {currentQty > 0
                  ? `${formatToman(currentAvgPrice, language)} ${t('common.toman')}`
                  : language === 'en'
                    ? 'No prior buys'
                    : 'بدون خرید قبلی'}
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                {t('dca.newAmount')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={newAmountToman}
                onChange={(e) => setNewAmountToman(formatCurrencyInput(e.target.value))}
                className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)] tabular-nums"
                placeholder="50,000,000"
                dir="ltr"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10000000, 25000000, 50000000, 100000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewAmountToman(formatCurrencyInput(val))}
                    className="px-2.5 py-1 rounded-lg bg-[var(--muted-surface)] hover:bg-[var(--brand-soft)] text-xs font-semibold text-[color:var(--text-muted)] hover:text-[var(--brand-primary)] border border-[color:var(--border-color)] transition-colors tabular-nums"
                  >
                    {language === 'en' ? `${val / 1000000}M` : `${val / 1000000} م`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 gap-1">
                <label className="text-xs font-bold text-[color:var(--text-muted)]">
                  {t('dca.unitBuyPrice')}
                </label>
                <button
                  type="button"
                  onClick={() => setCustomPriceToman(formatCurrencyInput(Math.round(livePrice)))}
                  className="inline-flex items-center gap-1 text-xs text-[var(--brand-primary)] font-bold hover:underline tabular-nums"
                >
                  <Zap size={11} />
                  <span>{formatToman(livePrice, language)}</span>
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={customPriceToman}
                onChange={(e) => setCustomPriceToman(formatCurrencyInput(e.target.value))}
                placeholder={formatCurrencyInput(Math.round(livePrice))}
                className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)] tabular-nums"
                dir="ltr"
              />
              <span className="text-xs text-[color:var(--text-muted)] block px-1">
                {language === 'en'
                  ? 'Defaults to live market price if left blank'
                  : 'در صورت خالی بودن، قیمت لحظه‌ای بازار لحاظ می‌شود'}
              </span>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="p-4 sm:p-5 rounded-[20px] bg-slate-900 border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400">{t('dca.simulationResult')}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tabular-nums" dir="ltr">
                +{formatNumber(newUnits, 3, language)} {language === 'en' ? 'units' : 'واحد جدید'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  {t('dca.newAvgPrice')}
                </span>
                <div className="text-base sm:text-lg font-extrabold text-amber-400 tabular-nums" dir="ltr">
                  {formatToman(newAvgPrice, language)}{' '}
                  <span className="text-xs text-slate-300 font-medium">{t('common.toman')}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  {t('dca.avgPriceChange')}
                </span>
                <div
                  className={`text-base sm:text-lg font-extrabold inline-flex items-center gap-1 tabular-nums ${
                    avgChangePercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  dir="ltr"
                >
                  {avgChangePercent <= 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  <span>{formatPercent(Math.abs(avgChangePercent), language).replace('+', '')}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  {t('dca.totalUnitsAfter')}
                </span>
                <div className="text-sm font-bold text-white tabular-nums" dir="ltr">
                  {formatNumber(totalUnitsAfter, 3, language)} {assetInfo.name}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  {t('dca.totalCostAfter')}
                </span>
                <div className="text-sm font-bold text-white tabular-nums" dir="ltr">
                  {formatToman(totalCostBasisAfter, language)}{' '}
                  <span className="text-xs text-slate-400">{language === 'en' ? 'T' : 'ت'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-[color:var(--border-color)] bg-[var(--muted-surface)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[42px] px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold shadow-gold transition-colors"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
