import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Download,
  Moon,
  Sun,
  Shield,
  Settings,
  ArrowRight,
  TrendingUp,
  Coins,
  DollarSign,
  Calculator,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, PriceData, getAssetDetail } from '../types';
import { formatNumber, formatToman } from '../utils/formatting';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  prices: PriceData | null;
  onOpenNewTransaction: (defaultSymbol?: AssetSymbol) => void;
  onOpenGoldBubble: () => void;
  onOpenExportImport: () => void;
  onRefreshPrices: () => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  theme: string;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  prices,
  onOpenNewTransaction,
  onOpenGoldBubble,
  onOpenExportImport,
  onRefreshPrices,
  onOpenSettings,
  onOpenAdmin,
  isAdmin,
  theme,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Price map
  const priceMap = useMemo(() => {
    if (!prices) return {};
    const map: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
      ...prices.fiatPricesToman,
      ...prices.cryptoPricesToman,
      ...prices.goldPricesToman,
    };
    return map;
  }, [prices]);

  // Quick Currency Converter Parser (e.g. "2.5 btc", "100 usd", "5 sekkeh")
  const converterResult = useMemo(() => {
    if (!query.trim()) return null;
    const match = query.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z0-9_\u0600-\u06FF-]+)$/);
    if (!match) return null;

    const amount = parseFloat(match[1]);
    const rawSymbol = match[2].toUpperCase();

    // Find matching symbol
    const foundSymbol = Object.keys(ASSET_DETAILS).find(
      (s) => s.toUpperCase() === rawSymbol || ASSET_DETAILS[s].name.includes(rawSymbol)
    );

    if (foundSymbol && priceMap[foundSymbol]) {
      const unitPrice = priceMap[foundSymbol];
      const totalToman = amount * unitPrice;
      return {
        amount,
        symbol: foundSymbol,
        name: ASSET_DETAILS[foundSymbol].name,
        unitPrice,
        totalToman,
      };
    }

    return null;
  }, [query, priceMap]);

  // Action Commands
  const actions = useMemo(() => {
    return [
      {
        id: 'action-new-tx',
        title: 'ثبت تراکنش جدید',
        subtitle: 'افزودن خرید جدید به سبد دارایی',
        icon: Plus,
        category: 'دستورات سریع',
        badge: 'تراکنش',
        action: () => {
          onClose();
          onOpenNewTransaction();
        },
      },
      {
        id: 'action-gold-bubble',
        title: 'محاسبه‌گر حباب طلا و سکه',
        subtitle: 'تحلیل دقیق ارزش ذاتی و حباب بازار بر اساس انس جهانی',
        icon: Sparkles,
        category: 'دستورات سریع',
        badge: 'ابزار ویژه',
        action: () => {
          onClose();
          onOpenGoldBubble();
        },
      },
      {
        id: 'action-export-import',
        title: 'خروجی اکسل / پشتیبان‌گیری',
        subtitle: 'دانلود گزارش کامل به فرمت Excel (CSV) یا فایل JSON',
        icon: Download,
        category: 'دستورات سریع',
        badge: 'پشتیبان',
        action: () => {
          onClose();
          onOpenExportImport();
        },
      },
      {
        id: 'action-refresh',
        title: 'بروزرسانی زنده قیمت‌ها',
        subtitle: 'دریافت آخرین نرخ‌های آنلاین ارز، طلا و رمزارزها',
        icon: TrendingUp,
        category: 'دستورات سریع',
        badge: 'قیمت زنده',
        action: () => {
          onClose();
          onRefreshPrices();
        },
      },
      {
        id: 'action-settings',
        title: 'تنظیمات حساب کاربری',
        subtitle: 'مدیریت نام نمایشی، تغییر رمز عبور و سشن',
        icon: Settings,
        category: 'سیستم',
        badge: 'تنظیمات',
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
      ...(isAdmin && onOpenAdmin
        ? [
            {
              id: 'action-admin',
              title: 'پنل مدیریت ادمین',
              subtitle: 'مدیریت کاربران، مانیتورینگ تراکنش‌ها و امنیت سرور',
              icon: Shield,
              category: 'سیستم',
              badge: 'ادمین',
              action: () => {
                onClose();
                onOpenAdmin();
              },
            },
          ]
        : []),
    ];
  }, [isAdmin, onClose, onOpenNewTransaction, onOpenGoldBubble, onOpenExportImport, onRefreshPrices, onOpenSettings, onOpenAdmin]);

  // Asset search list
  const assetItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(ASSET_DETAILS)
      .filter(([symbol, details]) => {
        if (!q) return false;
        return symbol.toLowerCase().includes(q) || details.name.toLowerCase().includes(q);
      })
      .slice(0, 10)
      .map(([symbol, details]) => {
        const currentPrice = priceMap[symbol] || 0;
        return {
          id: `asset-${symbol}`,
          title: details.name,
          subtitle: `${symbol} • ${currentPrice > 0 ? formatToman(currentPrice) : 'قیمت در دسترس نیست'}`,
          icon: details.type === 'CRYPTO' ? Coins : details.type === 'GOLD' ? Sparkles : DollarSign,
          category: 'دارایی‌ها و قیمت زنده',
          badge: details.type,
          action: () => {
            onClose();
            onOpenNewTransaction(symbol);
          },
        };
      });
  }, [query, priceMap, onClose, onOpenNewTransaction]);

  // Filtered list
  const allItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;

    const filteredActions = actions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    return [...assetItems, ...filteredActions];
  }, [actions, assetItems, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (converterResult) {
        onClose();
        onOpenNewTransaction(converterResult.symbol);
        return;
      }
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-start justify-center bg-black/60 backdrop-blur-md p-3 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-[color:var(--border-color)] flex items-center gap-3 bg-[color:var(--muted-surface)]">
          <Search size={20} className="text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="جستجو در دارایی‌ها، دستورات یا تبدیل سریع (مثلاً: 2 btc یا طلا)..."
            className="w-full bg-transparent text-sm font-bold text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-[color:var(--pill-bg)] text-[color:var(--text-muted)]"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-1 rounded bg-[color:var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Live Quick Converter Card (if query is amount + currency) */}
        {converterResult && (
          <div className="p-4 mx-3 my-2 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-500/30 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                <Calculator size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-[color:var(--text-muted)]">
                  تبدیل هوشمند: {converterResult.amount} {converterResult.name}
                </div>
                <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400" dir="ltr">
                  = {formatToman(converterResult.totalToman)}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenNewTransaction(converterResult.symbol);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-500 transition-all flex items-center gap-1"
            >
              <Plus size={14} />
              ثبت خرید
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="text-center py-10 text-[color:var(--text-muted)] font-bold text-xs">
              نتیجه‌ای برای «{query}» یافت نشد.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'hover:bg-[color:var(--muted-surface)] text-[color:var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[color:var(--muted-surface)] text-blue-500 border border-[color:var(--border-color)]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-black text-xs leading-none mb-1">{item.title}</div>
                      <div
                        className={`text-[10px] font-bold ${
                          isSelected ? 'text-white/80' : 'text-[color:var(--text-muted)]'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <CornerDownLeft size={14} className="text-white/70" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <footer className="px-4 py-2.5 bg-[color:var(--muted-surface)] border-t border-[color:var(--border-color)] flex items-center justify-between text-[10px] text-[color:var(--text-muted)] font-bold">
          <div className="flex items-center gap-3">
            <span>
              ناوبری: <kbd className="font-mono bg-[color:var(--card-bg)] px-1 rounded border">↑</kbd>{' '}
              <kbd className="font-mono bg-[color:var(--card-bg)] px-1 rounded border">↓</kbd>
            </span>
            <span>
              انتخاب: <kbd className="font-mono bg-[color:var(--card-bg)] px-1 rounded border">ENTER</kbd>
            </span>
          </div>
          <span className="hidden sm:inline">CMC Spotlight Command Palette</span>
        </footer>
      </div>
    </div>
  );
};
