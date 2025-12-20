import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, Currency, getAssetDetail } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/formatting';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [assetSymbol, setAssetSymbol] = useState<AssetSymbol>('USD');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('TOMAN');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!quantity || !price) return;
    
    onSave({
      assetSymbol,
      quantity: parseFloat(quantity),
      buyPricePerUnit: parseCurrencyInput(price),
      buyDateTime: new Date(date).toISOString(),
      buyCurrency: currency,
      feesToman: 0,
    });
    onClose();
    // Reset form
    setQuantity('');
    setPrice('');
  };

  const assetOptions = Object.entries(ASSET_DETAILS).map(([key, val]) => ({
    symbol: key as AssetSymbol,
    ...val
  }));

  const isCrypto = getAssetDetail(assetSymbol).type === 'CRYPTO';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">افزودن تراکنش خرید</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Asset Selection */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">انتخاب دارایی</label>
            <select 
              value={assetSymbol}
              onChange={(e) => {
                const newSymbol = e.target.value as AssetSymbol;
                setAssetSymbol(newSymbol);
                // Default currency logic
                if (getAssetDetail(newSymbol).type === 'CRYPTO') {
                  setCurrency('USD');
                } else {
                  setCurrency('TOMAN');
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {assetOptions.map(opt => (
                <option key={opt.symbol} value={opt.symbol}>
                  {opt.name} ({opt.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">تعداد / مقدار</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left"
                dir="ltr"
              />
            </div>
            
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">تاریخ خرید</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium text-gray-500">قیمت خرید (واحد)</label>
              {isCrypto && (
                 <div className="flex gap-2 text-xs">
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`${currency === 'USD' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
                    >USD</button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setCurrency('TOMAN')}
                      className={`${currency === 'TOMAN' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
                    >TOMAN</button>
                 </div>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={price}
                onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                placeholder={currency === 'USD' ? 'Price in USD' : 'قیمت به تومان'}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left pl-12"
                dir="ltr"
              />
              <div className="absolute left-3 top-3 text-xs font-bold text-gray-400 pointer-events-none">
                {currency === 'USD' ? '$' : 'T'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0">
          <button 
            onClick={handleSave}
            disabled={!quantity || !price}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            <span>ثبت تراکنش</span>
          </button>
        </div>
      </div>
    </div>
  );
};
