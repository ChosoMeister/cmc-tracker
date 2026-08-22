
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, Currency, Transaction, getAssetDetail } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/formatting';
import { JalaliDatePicker } from './JalaliDatePicker';
import { ConfirmDialog } from './ConfirmDialog';

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
  const [assetSymbol, setAssetSymbol] = useState<AssetSymbol>('USD');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [wallet, setWallet] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const mutedText = 'text-[color:var(--text-muted)]';

  const WALLET_SUGGESTIONS = ['نوبیتکس', 'والکس', 'بایننس', 'لجر (Ledger)', 'تراست ولت', 'گاوصندوق خانگی', 'بانک'];
  const TAG_SUGGESTIONS = ['#هولد_بلندمدت', '#نوسان‌گیری', '#پس‌انداز_اضطراری', '#سرمایه‌گذاری_ماهانه'];

  useEffect(() => {
    if (initialData) {
      setAssetSymbol(initialData.assetSymbol);
      setQuantity(formatQuantityInput(initialData.quantity.toString()));
      setPrice(formatCurrencyInput(initialData.buyPricePerUnit.toString()));
      setDate(new Date(initialData.buyDateTime).toISOString().split('T')[0]);
      setCurrency(initialData.buyCurrency);
      setWallet(initialData.wallet || '');
      setTags(initialData.tags || []);
    } else {
      // Default for new
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
    ...val
  }));

  const isCrypto = getAssetDetail(assetSymbol).type === 'CRYPTO';

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-sm max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-[color:var(--border-color)]">
          <div className="px-6 py-5 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[color:var(--muted-surface)]">
            <h3 className="font-black text-[color:var(--text-primary)]">
              {initialData ? 'ویرایش تراکنش' : 'افزودن تراکنش خرید'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Asset Selection */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>انتخاب دارایی</label>
              <select
                value={assetSymbol}
                onChange={(e) => {
                  const newSymbol = e.target.value as AssetSymbol;
                  setAssetSymbol(newSymbol);
                  if (getAssetDetail(newSymbol).type === 'CRYPTO') setCurrency('USD');
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
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>مقدار</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(formatQuantityInput(e.target.value))}
                  placeholder="۰"
                  className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left text-[color:var(--text-primary)]"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>تاریخ</label>
                <JalaliDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="انتخاب تاریخ"
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>قیمت واحد</label>
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
                  placeholder={currency === 'USD' ? 'Price in USD' : 'قیمت به تومان'}
                  className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left pl-12 text-[color:var(--text-primary)]"
                  dir="ltr"
                />
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black ${mutedText} pointer-events-none`}>
                  {currency === 'USD' ? '$' : 'T'}
                </div>
              </div>
            </div>

            {/* Wallet / Exchange */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>محل نگهداری / صرافی / کیف‌پول</label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="مثلاً: نوبیتکس، لجر، گاوصندوق، بایننس..."
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
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>برچسب‌ها (Tags)</label>
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
                  placeholder="افزودن برچسب (مثلاً #هولد)..."
                  className="flex-1 bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[color:var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 bg-blue-600/10 text-blue-600 rounded-2xl text-xs font-black hover:bg-blue-600/20"
                >
                  افزودن
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
                {TAG_SUGGESTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTag(t)}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] hover:text-blue-500 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex flex-col gap-2.5 border-t border-[color:var(--border-color)]">
            <button
              onClick={handleSave}
              disabled={!quantity || !price}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
            >
              <Check size={18} strokeWidth={3} />
              <span>{initialData ? 'بروزرسانی تغییرات' : 'ثبت تراکنش'}</span>
            </button>

            {initialData && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={18} />
                <span>حذف تراکنش</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="حذف تراکنش"
        message="آیا از حذف این تراکنش اطمینان دارید؟ این عمل غیرقابل بازگشت است."
        confirmLabel="حذف"
        cancelLabel="انصراف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
