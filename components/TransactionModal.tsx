
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, Currency, Transaction, TransactionType, getAssetDetail } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/formatting';
import { JalaliDatePicker } from './JalaliDatePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useTranslation } from '../contexts/LanguageContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
}

// Format number with thousand separators
const formatQuantityInput = (value: string): string => {
  // Remove non-numeric except decimal
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

// Parse formatted number back to number
const parseQuantityInput = (value: string): number => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const { t, language } = useTranslation();
  const [assetSymbol, setAssetSymbol] = useState<AssetSymbol>('USD');
  const [type, setType] = useState<TransactionType>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [wallet, setWallet] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const mutedText = 'text-[color:var(--text-muted)]';

  const WALLET_SUGGESTIONS = language === 'en'
    ? ['Nobitex', 'Wallex', 'Binance', 'Ledger', 'Trust Wallet', 'Home Safe', 'Bank']
    : ['نوبیتکس', 'والکس', 'بایننس', 'لجر (Ledger)', 'تراست ولت', 'گاوصندوق خانگی', 'بانک'];

  const TAG_SUGGESTIONS = language === 'en'
    ? ['#long_term', '#scalping', '#emergency_fund', '#monthly_dca']
    : ['#هولد_بلندمدت', '#نوسان‌گیری', '#پس‌انداز_اضطراری', '#سرمایه‌گذاری_ماهانه'];

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'BUY');
      setAssetSymbol(initialData.assetSymbol);
      setQuantity(formatQuantityInput(initialData.quantity.toString()));
      setPrice(formatCurrencyInput(initialData.buyPricePerUnit.toString()));
      setDate(new Date(initialData.buyDateTime).toISOString().split('T')[0]);
      setCurrency(initialData.buyCurrency);
      setWallet(initialData.wallet || '');
      setTags(initialData.tags || []);
    } else {
      // Default for new
      setType('BUY');
      setAssetSymbol('USD');
      setQuantity('');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
      setCurrency('TOMAN');
      setWallet('');
      setTags([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (newTag: string) => {
    const formatted = newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
    if (formatted.length > 1 && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!quantity || !price) return;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      assetSymbol,
      type,
      quantity: parseQuantityInput(quantity),
      buyPricePerUnit: parseCurrencyInput(price),
      buyDateTime: new Date(date).toISOString(),
      buyCurrency: currency,
      feesToman: initialData?.feesToman || 0,
      wallet: wallet.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const assetOptions = Object.entries(ASSET_DETAILS).map(([key, val]) => ({
    symbol: key as AssetSymbol,
    ...val,
    name: getAssetDetail(key as AssetSymbol, language).name
  }));

  const isCrypto = getAssetDetail(assetSymbol, language).type === 'CRYPTO';

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-sm max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-[color:var(--border-color)]">
          <div className="px-6 py-5 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[color:var(--muted-surface)]">
            <h3 className="font-black text-[color:var(--text-primary)]">
              {initialData ? t('tx.editTitle') : t('tx.addTitle')}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] transition-colors" aria-label={t('common.close')}>
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Transaction Type: BUY vs SELL */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  type === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                <span>{t('tx.buy')}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  type === 'SELL'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                <span>{t('tx.sell')}</span>
              </button>
            </div>

            {/* Asset Selection */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>{t('tx.selectAsset')}</label>
              <select
                value={assetSymbol}
                onChange={(e) => {
                  const newSymbol = e.target.value as AssetSymbol;
                  setAssetSymbol(newSymbol);
                  if (getAssetDetail(newSymbol, language).type === 'CRYPTO') setCurrency('USD');
                  else setCurrency('TOMAN');
                }}
                className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-[color:var(--text-primary)]"
              >
                {assetOptions.map(opt => (
                  <option key={opt.symbol} value={opt.symbol}>
                    {opt.name} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>{t('tx.amount')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(formatQuantityInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left text-[color:var(--text-primary)]"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>{t('tx.date')}</label>
                <JalaliDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder={language === 'en' ? 'Select Date' : 'انتخاب تاریخ'}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>{t('tx.unitPrice')}</label>
                {isCrypto && (
                  <div className="flex gap-2 text-[10px] font-black">
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`${currency === 'USD' ? 'text-blue-600' : mutedText}`}
                    >USD</button>
                    <span className={`${mutedText}`}>|</span>
                    <button
                      onClick={() => setCurrency('TOMAN')}
                      className={`${currency === 'TOMAN' ? 'text-blue-600' : mutedText}`}
                    >TOMAN</button>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                  placeholder={currency === 'USD' ? 'Price in USD' : (language === 'en' ? 'Price in Toman' : 'قیمت به تومان')}
                  className={`w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left ${language === 'en' ? 'pl-8 pr-4' : 'pl-12 pr-4'} text-[color:var(--text-primary)]`}
                  dir="ltr"
                />
                <div className={`absolute ${language === 'en' ? 'left-3' : 'left-4'} top-1/2 -translate-y-1/2 text-xs font-black ${mutedText} pointer-events-none`}>
                  {currency === 'USD' ? '$' : (language === 'en' ? 'T' : 'ت')}
                </div>
              </div>
            </div>

            {/* Wallet / Exchange */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>{t('tx.walletExchange')}</label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Binance, Ledger, Safe...' : 'مثلاً: نوبیتکس، لجر، گاوصندوق، بایننس...'}
                className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[color:var(--text-primary)]"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {WALLET_SUGGESTIONS.slice(0, 4).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWallet(w)}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] hover:text-blue-500 transition-colors"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>{t('tx.tags')}</label>
              <div className="flex gap-1.5">
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
                  placeholder={language === 'en' ? 'Add tag (e.g., #dca)...' : 'افزودن برچسب (مثلاً #هولد)...'}
                  className="flex-1 bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[color:var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 bg-blue-600/10 text-blue-600 rounded-2xl text-xs font-black hover:bg-blue-600/20"
                >
                  {t('tx.addTag')}
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-1">
                {TAG_SUGGESTIONS.map(tLabel => (
                  <button
                    key={tLabel}
                    type="button"
                    onClick={() => handleAddTag(tLabel)}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] hover:text-blue-500 transition-colors"
                  >
                    {tLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex flex-col gap-2.5 border-t border-[color:var(--border-color)]">
            <button
              onClick={handleSave}
              disabled={!quantity || !price}
              className={`w-full ${
                type === 'SELL'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              } active:scale-95 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50`}
            >
              <Check size={18} strokeWidth={3} />
              <span>
                {initialData
                  ? t('tx.update')
                  : type === 'SELL'
                  ? t('tx.recordSell')
                  : t('tx.recordBuy')}
              </span>
            </button>

            {initialData && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={18} />
                <span>{t('tx.delete')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
