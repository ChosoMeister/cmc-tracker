import React, { useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Edit2,
  Trash2,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AssetSummary,
  AssetSymbol,
  Transaction,
  getAssetDetail,
  isCoinAsset,
  resolveAssetSymbol,
} from '../types';
import {
  formatToman,
  formatPercent,
  formatNumber,
  formatDateCached,
  getAssetIconUrl,
  getAssetFallbackIcon,
} from '../utils/formatting';
import { useTranslation } from '../contexts/LanguageContext';

interface AssetDetailDrawerProps {
  asset: AssetSummary | null;
  transactions: Transaction[];
  usdToToman: number;
  onClose: () => void;
  onOpenNewTx: (symbol: AssetSymbol, type?: 'BUY' | 'SELL') => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  transactions,
  usdToToman,
  onClose,
  onOpenNewTx,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { language, t } = useTranslation();

  useEffect(() => {
    if (!asset) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset, onClose]);

  const assetTxs = useMemo(() => {
    if (!asset) return [];
    return transactions
      .filter((tx) => resolveAssetSymbol(tx) === asset.symbol)
      .sort((a, b) => new Date(b.buyDateTime).getTime() - new Date(a.buyDateTime).getTime());
  }, [asset, transactions]);

  const custodyBreakdown = useMemo(() => {
    if (!asset) return [];
    const map = new Map<string, number>();
    const defaultLabel = language === 'en' ? 'Unspecified Custody' : 'بدون کیف پول / پیش‌فرض';
    // Replay chronologically for net quantity per wallet
    const chronological = [...assetTxs].reverse();
    chronological.forEach((tx) => {
      const w = tx.wallet?.trim() || defaultLabel;
      const prev = map.get(w) || 0;
      const delta = (tx.type || 'BUY') === 'SELL' ? -tx.quantity : tx.quantity;
      map.set(w, Math.max(0, prev + delta));
    });
    return Array.from(map.entries())
      .filter(([, qty]) => qty > 0.000001)
      .sort((a, b) => b[1] - a[1]);
  }, [asset, assetTxs, language]);

  if (!asset) return null;

  const detail = getAssetDetail(asset.symbol, language);
  const isProfit = asset.pnlToman >= 0;
  const avgBuyToman = asset.totalQuantity > 0 ? asset.costBasisToman / asset.totalQuantity : 0;
  const tomanShort = language === 'en' ? 'T' : 'ت';

  const unitLabel = (() => {
    if (isCoinAsset(asset.symbol)) return language === 'en' ? 'pcs' : 'عدد';
    if (asset.symbol === 'ABSHODEH') return language === 'en' ? 'mithqal' : 'مثقال';
    if (asset.symbol === 'USD_XAU' || asset.symbol === 'XAG') return language === 'en' ? 'oz' : 'انس';
    if (asset.type === 'GOLD') return language === 'en' ? 'g' : 'گرم';
    return asset.symbol;
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail.name}
      className="fixed inset-0 z-[115] flex justify-end"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full sm:max-w-lg h-full bg-[var(--card-bg)] text-[color:var(--text-primary)] border-s border-[color:var(--border-color)] shadow-2xl flex flex-col ${
          language === 'en' ? 'drawer-enter-ltr' : 'drawer-enter-rtl'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-[color:var(--border-color)] flex items-center justify-between gap-3 bg-[var(--muted-surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--card-bg)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center shrink-0">
              <img
                src={getAssetIconUrl(asset.symbol)}
                alt={asset.symbol}
                width={32}
                height={32}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAssetFallbackIcon(asset.symbol);
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base truncate">{detail.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--pill-bg)] text-[color:var(--text-muted)]">
                  {asset.symbol}
                </span>
              </div>
              <p className="text-xs text-[color:var(--text-muted)] font-medium tabular-nums mt-0.5">
                {language === 'en' ? 'Portfolio Weight:' : 'سهم از کل سبد:'}{' '}
                {formatPercent(asset.allocationPercent, language).replace('+', '')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-[var(--pill-bg)] flex items-center justify-center text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Position Hero */}
          <div className="p-4 rounded-[20px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-xs font-semibold text-[color:var(--text-muted)] block">
                  {language === 'en' ? 'Current Position Value' : 'ارزش روز دارایی شما'}
                </span>
                <div className="text-2xl font-extrabold text-[color:var(--text-primary)] tabular-nums mt-1" dir="ltr">
                  {formatToman(asset.currentValueToman, language)}{' '}
                  <span className="text-xs font-semibold text-[color:var(--text-muted)]">
                    {t('common.toman')}
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl text-end tabular-nums ${
                  isProfit
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                }`}
                dir="ltr"
              >
                <div className="text-xs font-bold inline-flex items-center gap-1">
                  {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {formatPercent(asset.pnlPercent, language)}
                </div>
                <div className="text-xs font-semibold mt-0.5">
                  {isProfit ? '+' : '-'}
                  {formatToman(Math.abs(asset.pnlToman), language)} {tomanShort}
                </div>
              </div>
            </div>

            {/* 4 Key Position Metrics */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[color:var(--border-color)]">
              <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)]">
                <span className="text-xs text-[color:var(--text-muted)] block">
                  {language === 'en' ? 'Owned Balance' : 'موجودی کل'}
                </span>
                <span className="text-sm font-bold tabular-nums mt-0.5 block" dir="ltr">
                  {formatNumber(asset.totalQuantity, 4, language)} {unitLabel}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)]">
                <span className="text-xs text-[color:var(--text-muted)] block">
                  {language === 'en' ? 'Avg Break-Even' : 'میانگین خرید سر‌به‌سر'}
                </span>
                <span className="text-sm font-bold tabular-nums mt-0.5 block" dir="ltr">
                  {formatToman(avgBuyToman, language)} {tomanShort}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)]">
                <span className="text-xs text-[color:var(--text-muted)] block">
                  {language === 'en' ? 'Live Unit Price' : 'قیمت لحظه‌ای بازار'}
                </span>
                <span className="text-sm font-bold tabular-nums mt-0.5 block" dir="ltr">
                  {formatToman(asset.currentPriceToman, language)} {tomanShort}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)]">
                <span className="text-xs text-[color:var(--text-muted)] block">
                  {language === 'en' ? 'Cost Basis' : 'بهای تمام‌شده'}
                </span>
                <span className="text-sm font-bold tabular-nums mt-0.5 block" dir="ltr">
                  {formatToman(asset.costBasisToman, language)} {tomanShort}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Trade Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onOpenNewTx(asset.symbol, 'BUY')}
              className="min-h-[44px] rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-gold transition-colors"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>{language === 'en' ? 'Buy More' : 'ثبت خرید جدید'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewTx(asset.symbol, 'SELL')}
              className="min-h-[44px] rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{language === 'en' ? 'Record Sell' : 'ثبت فروش از موجودی'}</span>
            </button>
          </div>

          {/* Custody / Wallet Breakdown */}
          {custodyBreakdown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--text-primary)]">
                <Wallet size={14} className="text-[var(--brand-primary)]" />
                <span>{language === 'en' ? 'Custody & Storage Breakdown' : 'تفکیک محل نگهداری دارایی'}</span>
              </div>
              <div className="rounded-xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] divide-y divide-[color:var(--border-color)]">
                {custodyBreakdown.map(([place, qty]) => (
                  <div key={place} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[color:var(--text-primary)]">{place}</span>
                    <span className="font-bold text-[color:var(--text-muted)] tabular-nums" dir="ltr">
                      {formatNumber(qty, 4, language)} {unitLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset Transaction History */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--text-primary)]">
                <History size={14} className="text-[var(--brand-primary)]" />
                <span>
                  {language === 'en'
                    ? `Trade History (${assetTxs.length})`
                    : `سابقه تراکنش‌های این دارایی (${formatNumber(assetTxs.length, 0, language)})`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {assetTxs.map((tx) => {
                const isSell = tx.type === 'SELL';
                const txTotalToman =
                  tx.quantity *
                    tx.buyPricePerUnit *
                    (tx.buyCurrency === 'USD' ? usdToToman || 70000 : 1) +
                  (tx.feesToman || 0);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                            isSell
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {isSell ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isSell ? t('transactions.typeSell') : t('transactions.typeBuy')}
                        </span>
                        <span className="text-xs font-bold text-[color:var(--text-primary)] tabular-nums" dir="ltr">
                          {formatNumber(tx.quantity, 4, language)} {unitLabel}
                        </span>
                        <span className="text-xs text-[color:var(--text-muted)] tabular-nums">
                          {formatDateCached(tx.buyDateTime, language)}
                        </span>
                      </div>

                      <div className="text-xs text-[color:var(--text-muted)] tabular-nums flex items-center gap-2 flex-wrap">
                        <span dir="ltr">
                          @ {formatNumber(tx.buyPricePerUnit, 2, language)}{' '}
                          {tx.buyCurrency === 'USD' ? '$' : tomanShort}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-[color:var(--text-primary)]" dir="ltr">
                          {formatToman(txTotalToman, language)} {tomanShort}
                        </span>
                        {tx.wallet && <span>• {tx.wallet}</span>}
                      </div>

                      {tx.note && (
                        <p className="text-xs text-[color:var(--text-muted)] italic truncate">
                          {tx.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-[var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] flex items-center justify-center transition-colors"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
