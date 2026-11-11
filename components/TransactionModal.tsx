import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Trash2, Zap, AlertCircle } from 'lucide-react';
import {
  ASSET_DETAILS,
  AssetSymbol,
  AssetSummary,
  Currency,
  PriceData,
  Transaction,
  TransactionType,
  getAssetDetail,
  resolveAssetSymbol,
} from '../types';
import {
  formatCurrencyInput,
  parseCurrencyInput,
  formatToman,
  formatNumber,
  toEnglishDigits,
} from '../utils/formatting';
import { JalaliDatePicker } from './JalaliDatePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useTranslation } from '../contexts/LanguageContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  defaultAssetSymbol?: AssetSymbol | null;
  defaultType?: TransactionType;
  prices?: PriceData | null;
  portfolioAssets?: AssetSummary[];
}

const formatQuantityInput = (value: string): string => {
  const cleaned = toEnglishDigits(value).replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

const parseQuantityInput = (value: string): number => {
  return parseFloat(toEnglishDigits(value).replace(/,/g, '')) || 0;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultAssetSymbol,
  defaultType = 'BUY',
  prices,
  portfolioAssets = [],
}) => {
  const { t, language } = useTranslation();
  const isEditing = Boolean(initialData?.id);

  const [assetSymbol, setAssetSymbol] = useState<AssetSymbol>('GOLD18');
  const [type, setType] = useState<TransactionType>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fees, setFees] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [wallet, setWallet] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const WALLET_SUGGESTIONS =
    language === 'en'
      ? ['Nobitex', 'Wallex', 'Binance', 'Ledger', 'Trust Wallet', 'Home Safe', 'Bank Vault']
      : ['نوبیتکس', 'والکس', 'بایننس', 'لجر (Ledger)', 'تراست ولت', 'گاوصندوق خانگی', 'صندوق امانات بانک'];

  const TAG_SUGGESTIONS =
    language === 'en'
      ? ['#long_term', '#scalping', '#emergency_fund', '#monthly_dca']
      : ['#هولد_بلندمدت', '#نوسان‌گیری', '#پس‌انداز_اضطراری', '#خرید_پله‌ای'];

  const getLiveMarketUnitPrice = (sym: AssetSymbol, cur: Currency): number => {
    if (!prices) return 0;
    const detail = getAssetDetail(sym, language);
    let tomanRate = 0;
    if (detail.type === 'GOLD') {
      tomanRate =
        prices.goldPricesToman?.[sym] ||
        (sym === 'GOLD18' ? prices.gold18ToToman : 0) ||
        (sym === 'GRAM_COIN' ? prices.goldPricesToman?.GERAMI || prices.goldPricesToman?.SEK || 0 : 0);
    } else if (detail.type === 'FIAT') {
      tomanRate =
        prices.fiatPricesToman?.[sym] ||
        (sym === 'USD' ? prices.usdToToman : sym === 'EUR' ? prices.eurToToman : 0);
    } else {
      tomanRate = prices.cryptoPricesToman?.[sym] || 0;
    }

    if (cur === 'USD') {
      const usdDivisor = prices.cryptoPricesToman?.USDT || prices.usdToToman || 70000;
      if (sym === 'USDT' || sym === 'USD') return 1;
      const usdVal = tomanRate / usdDivisor;
      return usdVal >= 10 ? Math.round(usdVal * 100) / 100 : Number(usdVal.toFixed(4));
    }
    return Math.round(tomanRate);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && initialData.id) {
      const resolvedSym = resolveAssetSymbol(initialData);
      setType(initialData.type || 'BUY');
      setAssetSymbol(resolvedSym);
      setQuantity(formatQuantityInput(initialData.quantity.toString()));
      setPrice(formatCurrencyInput(initialData.buyPricePerUnit.toString()));
      setFees(initialData.feesToman ? formatCurrencyInput(initialData.feesToman.toString()) : '');
      setNote(initialData.note || '');
      setDate(new Date(initialData.buyDateTime).toISOString().split('T')[0]);
      setCurrency(initialData.buyCurrency);
      setWallet(initialData.wallet || '');
      setTags(initialData.tags || []);
    } else {
      const targetSym = defaultAssetSymbol || initialData?.assetSymbol || 'GOLD18';
      const targetType = defaultType || initialData?.type || 'BUY';
      const defaultCur: Currency =
        getAssetDetail(targetSym, language).type === 'CRYPTO' ? 'USD' : 'TOMAN';
      const liveUnit = getLiveMarketUnitPrice(targetSym, defaultCur);

      setType(targetType);
      setAssetSymbol(targetSym);
      setQuantity('');
      setCurrency(defaultCur);
      setPrice(liveUnit > 0 ? formatCurrencyInput(liveUnit.toString()) : '');
      setFees('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setWallet('');
      setTags([]);
    }
  }, [initialData, defaultAssetSymbol, defaultType, isOpen]);

  const assetOptions = useMemo(
    () =>
      Object.entries(ASSET_DETAILS).map(([key, val]) => ({
        symbol: key as AssetSymbol,
        ...val,
        name: getAssetDetail(key as AssetSymbol, language).name,
      })),
    [language]
  );

  if (!isOpen) return null;

  const isCrypto = getAssetDetail(assetSymbol, language).type === 'CRYPTO';
  const parsedQty = parseQuantityInput(quantity);
  const parsedPrice = parseCurrencyInput(price);
  const parsedFees = parseCurrencyInput(fees);

  const ownedAsset = portfolioAssets.find((a) => a.symbol === assetSymbol);
  // When editing an existing SELL, add back its old quantity to available balance
  const availableToSell =
    (ownedAsset?.totalQuantity || 0) +
    (isEditing && initialData?.type === 'SELL' && resolveAssetSymbol(initialData) === assetSymbol
      ? initialData.quantity
      : 0);

  const sellExceedsBalance = type === 'SELL' && parsedQty > availableToSell + 1e-6;

  const usdMultiplier = prices?.usdToToman || 70000;
  const estimatedTotalToman =
    parsedQty * parsedPrice * (currency === 'USD' ? usdMultiplier : 1) +
    (type === 'BUY' ? parsedFees : -parsedFees);

  const handleFillLivePrice = () => {
    const liveVal = getLiveMarketUnitPrice(assetSymbol, currency);
    if (liveVal > 0) {
      setPrice(formatCurrencyInput(liveVal.toString()));
    }
  };

  const handleAddTag = (newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (formatted.length > 1 && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tg) => tg !== tagToRemove));
  };

  const handleSave = () => {
    if (parsedQty <= 0 || parsedPrice <= 0 || sellExceedsBalance) return;

    onSave({
      ...(isEditing && initialData?.id ? { id: initialData.id } : {}),
      assetSymbol,
      type,
      quantity: parsedQty,
      buyPricePerUnit: parsedPrice,
      buyDateTime: new Date(date).toISOString(),
      buyCurrency: currency,
      feesToman: parsedFees || 0,
      note: note.trim() || undefined,
      wallet: wallet.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && initialData?.id && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? t('tx.editTitle') : t('tx.addTitle')}
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
          onClick={onClose}
        />

        <div className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden sheet-enter border border-[color:var(--border-color)]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[var(--muted-surface)]">
            <h3 className="font-bold text-base text-[color:var(--text-primary)]">
              {isEditing ? t('tx.editTitle') : t('tx.addTitle')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[38px] min-h-[38px] rounded-xl hover:bg-[var(--pill-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] flex items-center justify-center transition-colors"
              aria-label={t('common.close')}
            >
              <X size={19} />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* BUY vs SELL Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  type === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                <span>{t('tx.buy')}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  type === 'SELL'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                <span>{t('tx.sell')}</span>
              </button>
            </div>

            {/* Asset Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-[color:var(--text-muted)]">
                  {t('tx.selectAsset')}
                </label>
                {type === 'SELL' && (
                  <button
                    type="button"
                    onClick={() => setQuantity(formatQuantityInput(availableToSell.toString()))}
                    className="text-xs font-bold text-[var(--brand-primary)] hover:underline tabular-nums"
                  >
                    {language === 'en' ? 'Available:' : 'موجودی قابل فروش:'}{' '}
                    {formatNumber(availableToSell, 4, language)}
                  </button>
                )}
              </div>
              <select
                value={assetSymbol}
                onChange={(e) => {
                  const newSymbol = e.target.value as AssetSymbol;
                  const nextCur: Currency =
                    getAssetDetail(newSymbol, language).type === 'CRYPTO' ? 'USD' : 'TOMAN';
                  setAssetSymbol(newSymbol);
                  setCurrency(nextCur);
                  if (!isEditing) {
                    const liveUnit = getLiveMarketUnitPrice(newSymbol, nextCur);
                    setPrice(liveUnit > 0 ? formatCurrencyInput(liveUnit.toString()) : '');
                  }
                }}
                className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)]"
              >
                {assetOptions.map((opt) => (
                  <option key={opt.symbol} value={opt.symbol}>
                    {opt.name} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                  {t('tx.amount')}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(formatQuantityInput(e.target.value))}
                  placeholder="0"
                  className={`w-full min-h-[44px] bg-[var(--muted-surface)] border ${
                    sellExceedsBalance
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-[color:var(--border-color)] focus:ring-[var(--brand-primary)]'
                  } rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 outline-none text-left text-[color:var(--text-primary)] tabular-nums`}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                  {t('tx.date')}
                </label>
                <JalaliDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder={language === 'en' ? 'Select Date' : 'انتخاب تاریخ'}
                />
              </div>
            </div>

            {sellExceedsBalance && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  {language === 'en'
                    ? `Sell quantity exceeds your owned balance (${formatNumber(availableToSell, 4, 'en')} ${assetSymbol}).`
                    : `مقدار فروش بیشتر از موجودی فعلی شما در سبد (${formatNumber(availableToSell, 4, 'fa')}) است.`}
                </span>
              </div>
            )}

            {/* Unit Price + Live Market Auto-Fill */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1 gap-2 flex-wrap">
                <label className="text-xs font-bold text-[color:var(--text-muted)]">
                  {t('tx.unitPrice')}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillLivePrice}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline"
                  >
                    <Zap size={12} />
                    <span>{language === 'en' ? 'Live Rate' : 'نرخ لحظه‌ای بازار'}</span>
                  </button>

                  {isCrypto && (
                    <div className="inline-flex rounded-lg bg-[var(--muted-surface)] border border-[color:var(--border-color)] p-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('USD');
                          const lv = getLiveMarketUnitPrice(assetSymbol, 'USD');
                          if (lv > 0 && !isEditing) setPrice(formatCurrencyInput(lv.toString()));
                        }}
                        className={`px-2 py-0.5 rounded-md ${
                          currency === 'USD'
                            ? 'bg-[var(--card-bg)] text-[var(--brand-primary)] shadow-sm'
                            : 'text-[color:var(--text-muted)]'
                        }`}
                      >
                        USD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('TOMAN');
                          const lv = getLiveMarketUnitPrice(assetSymbol, 'TOMAN');
                          if (lv > 0 && !isEditing) setPrice(formatCurrencyInput(lv.toString()));
                        }}
                        className={`px-2 py-0.5 rounded-md ${
                          currency === 'TOMAN'
                            ? 'bg-[var(--card-bg)] text-[var(--brand-primary)] shadow-sm'
                            : 'text-[color:var(--text-muted)]'
                        }`}
                      >
                        TOMAN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                  placeholder={
                    currency === 'USD'
                      ? 'Price in USD'
                      : language === 'en'
                        ? 'Price in Toman'
                        : 'قیمت واحد به تومان'
                  }
                  className="w-full min-h-[44px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-sm font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-left text-[color:var(--text-primary)] tabular-nums"
                  dir="ltr"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[color:var(--text-muted)] pointer-events-none">
                  {currency === 'USD' ? '$' : language === 'en' ? 'T' : 'ت'}
                </div>
              </div>
            </div>

            {/* Live Total Toman Preview Card */}
            {parsedQty > 0 && parsedPrice > 0 && (
              <div className="p-3.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                  {type === 'SELL'
                    ? language === 'en'
                      ? 'Estimated Proceeds:'
                      : 'مبلغ خالص دریافتی فروش:'
                    : language === 'en'
                      ? 'Estimated Total Cost:'
                      : 'ارزش کل تخمینی تراکنش:'}
                </span>
                <span className="text-sm font-extrabold text-[var(--brand-primary)] tabular-nums" dir="ltr">
                  {formatToman(Math.max(0, estimatedTotalToman), language)} {t('common.toman')}
                </span>
              </div>
            )}

            {/* Fees & Custody Wallet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                  {t('transactions.fees')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fees}
                  onChange={(e) => setFees(formatCurrencyInput(e.target.value))}
                  placeholder="0"
                  className="w-full min-h-[42px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2 text-base sm:text-xs font-bold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-left text-[color:var(--text-primary)] tabular-nums"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                  {t('tx.walletExchange')}
                </label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder={language === 'en' ? 'e.g., Ledger, Safe...' : 'مثلاً: نوبیتکس، لجر، گاوصندوق'}
                  className="w-full min-h-[42px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2 text-base sm:text-xs font-semibold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)]"
                />
              </div>
            </div>

            {/* Quick Wallet Chips */}
            <div className="flex flex-wrap gap-1.5">
              {WALLET_SUGGESTIONS.slice(0, 5).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWallet(w)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    wallet === w
                      ? 'bg-[var(--brand-soft)] border-[var(--brand-border)] text-[var(--brand-primary)]'
                      : 'bg-[var(--muted-surface)] border-[color:var(--border-color)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Optional Note (Preserved on Edit!) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                {t('transactions.note')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Optional trade note (e.g., 18k coin dealer)...'
                    : 'یادداشت اختیاری (مثلاً نام طلافروشی، شماره فاکتور...)'
                }
                className="w-full min-h-[42px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3.5 py-2 text-base sm:text-xs font-medium focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[color:var(--text-muted)] px-1 block">
                {t('tx.tags')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder={language === 'en' ? 'Add tag (#dca)...' : 'افزودن برچسب (#هولد)...'}
                  className="flex-1 min-h-[40px] bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl px-3 py-2 text-base sm:text-xs font-semibold focus:ring-2 focus:ring-[var(--brand-primary)] outline-none text-[color:var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="min-h-[40px] px-3.5 bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] rounded-xl text-xs font-bold transition-colors"
                >
                  {t('tx.addTag')}
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500 font-bold"
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {TAG_SUGGESTIONS.map((tLabel) => (
                  <button
                    key={tLabel}
                    type="button"
                    onClick={() => handleAddTag(tLabel)}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--muted-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
                  >
                    {tLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-5 pt-3 flex flex-col gap-2 border-t border-[color:var(--border-color)] bg-[var(--card-bg)]">
            <button
              type="button"
              onClick={handleSave}
              disabled={parsedQty <= 0 || parsedPrice <= 0 || sellExceedsBalance}
              className={`w-full min-h-[46px] ${
                type === 'SELL'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose'
                  : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] shadow-gold'
              } active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-transform disabled:opacity-50 disabled:pointer-events-none`}
            >
              <Check size={18} strokeWidth={2.75} />
              <span>
                {isEditing
                  ? t('tx.update')
                  : type === 'SELL'
                    ? t('tx.recordSell')
                    : t('tx.recordBuy')}
              </span>
            </button>

            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full min-h-[42px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
                <span>{t('tx.delete')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('tx.deleteConfirmTitle')}
        message={t('tx.deleteConfirmMessage')}
        confirmLabel={t('tx.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
