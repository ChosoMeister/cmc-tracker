import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Download,
  Shield,
  Settings,
  TrendingUp,
  Coins,
  DollarSign,
  Calculator,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, PriceData, getAssetDetail } from '../types';
import { formatNumber, formatToman, toEnglishDigits } from '../utils/formatting';
import { useTranslation } from '../contexts/LanguageContext';

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
}) => {
  const { language, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

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
    const normalized = toEnglishDigits(query).trim();
    if (!normalized) return null;
    const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z0-9_\u0600-\u06FF-]+)$/);
    if (!match) return null;

    const amount = parseFloat(match[1]);
    const rawSymbol = match[2].toUpperCase();

    const foundSymbol = Object.keys(ASSET_DETAILS).find((s) => {
      const faName = ASSET_DETAILS[s].name;
      const enName = getAssetDetail(s, 'en').name.toUpperCase();
      return s.toUpperCase() === rawSymbol || faName.includes(rawSymbol) || enName.includes(rawSymbol);
    });

    if (foundSymbol && priceMap[foundSymbol]) {
      const unitPrice = priceMap[foundSymbol];
      const totalToman = amount * unitPrice;
      return {
        amount,
        symbol: foundSymbol as AssetSymbol,
        name: getAssetDetail(foundSymbol, language).name,
        unitPrice,
        totalToman,
      };
    }

    return null;
  }, [query, priceMap, language]);

  const actions = useMemo(() => {
    const isEn = language === 'en';
    return [
      {
        id: 'action-new-tx',
        title: isEn ? 'Add New Transaction' : 'ثبت تراکنش جدید',
        subtitle: isEn ? 'Record a buy or sell trade in your portfolio' : 'افزودن خرید یا فروش جدید به سبد دارایی',
        icon: Plus,
        badge: isEn ? 'Trade' : 'تراکنش',
        action: () => {
          onClose();
          onOpenNewTransaction();
        },
      },
      {
        id: 'action-gold-bubble',
        title: isEn ? 'Gold & Coin Bubble Calculator' : 'محاسبه‌گر حباب طلا و سکه',
        subtitle: isEn
          ? 'Analyze intrinsic melt value vs live market premium'
          : 'تحلیل دقیق ارزش ذاتی و حباب بازار بر اساس انس جهانی',
        icon: Coins,
        badge: isEn ? 'Tool' : 'ابزار',
        action: () => {
          onClose();
          onOpenGoldBubble();
        },
      },
      {
        id: 'action-export-import',
        title: isEn ? 'Backup & Excel Export' : 'خروجی اکسل / پشتیبان‌گیری',
        subtitle: isEn
          ? 'Download CSV report or full JSON snapshot'
          : 'دانلود گزارش کامل به فرمت Excel (CSV) یا فایل JSON',
        icon: Download,
        badge: isEn ? 'Backup' : 'پشتیبان',
        action: () => {
          onClose();
          onOpenExportImport();
        },
      },
      {
        id: 'action-refresh',
        title: isEn ? 'Refresh Live Market Rates' : 'بروزرسانی زنده قیمت‌ها',
        subtitle: isEn
          ? 'Fetch latest currency, bullion, and crypto quotes'
          : 'دریافت آخرین نرخ‌های آنلاین ارز، طلا و رمزارزها',
        icon: TrendingUp,
        badge: isEn ? 'Live' : 'نرخ زنده',
        action: () => {
          onClose();
          onRefreshPrices();
        },
      },
      {
        id: 'action-settings',
        title: isEn ? 'Preferences & Account Settings' : 'تنظیمات حساب کاربری',
        subtitle: isEn
          ? 'Manage display name, appearance theme, and security'
          : 'مدیریت نام نمایشی، تم ظاهری و تغییر رمز عبور',
        icon: Settings,
        badge: isEn ? 'System' : 'تنظیمات',
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
      ...(isAdmin && onOpenAdmin
        ? [
            {
              id: 'action-admin',
              title: isEn ? 'System User Management' : 'پنل مدیریت کاربران',
              subtitle: isEn
                ? 'Manage registered accounts, passwords, and system status'
                : 'مدیریت کاربران، رمزهای عبور و وضعیت سرور',
              icon: Shield,
              badge: isEn ? 'Admin' : 'ادمین',
              action: () => {
                onClose();
                onOpenAdmin();
              },
            },
          ]
        : []),
    ];
  }, [
    language,
    isAdmin,
    onClose,
    onOpenNewTransaction,
    onOpenGoldBubble,
    onOpenExportImport,
    onRefreshPrices,
    onOpenSettings,
    onOpenAdmin,
  ]);

  const assetItems = useMemo(() => {
    const q = toEnglishDigits(query).trim().toLowerCase();
    if (!q) return [];
    const isEn = language === 'en';

    return Object.entries(ASSET_DETAILS)
      .filter(([symbol, details]) => {
        const enName = getAssetDetail(symbol, 'en').name.toLowerCase();
        return (
          symbol.toLowerCase().includes(q) ||
          details.name.toLowerCase().includes(q) ||
          enName.includes(q)
        );
      })
      .slice(0, 10)
      .map(([symbol, details]) => {
        const currentPrice = priceMap[symbol] || 0;
        const localizedName = getAssetDetail(symbol, language).name;
        return {
          id: `asset-${symbol}`,
          title: localizedName,
          subtitle: `${symbol} • ${
            currentPrice > 0
              ? `${formatToman(currentPrice, language)} ${t('common.toman')}`
              : isEn
                ? 'Price unavailable'
                : 'قیمت در دسترس نیست'
          }`,
          icon: details.type === 'CRYPTO' ? Coins : details.type === 'GOLD' ? Coins : DollarSign,
          badge: details.type,
          action: () => {
            onClose();
            onOpenNewTransaction(symbol as AssetSymbol);
          },
        };
      });
  }, [query, priceMap, language, t, onClose, onOpenNewTransaction]);

  const allItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;

    const filteredActions = actions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    return [...assetItems, ...filteredActions];
  }, [actions, assetItems, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, allItems.length - 1)));
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
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-[160] flex items-start justify-center p-3 sm:p-6 pt-14 sm:pt-24"
    >
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      <div
        className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-xl rounded-[20px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-[color:var(--border-color)] flex items-center gap-3 bg-[var(--muted-surface)]">
          <Search size={19} className="text-[var(--brand-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'en'
                ? 'Search assets, commands, or convert live (e.g., 2.5 btc or 100 usd)...'
                : 'جستجوی دارایی، دستور یا تبدیل زنده (مثلاً: 2 btc یا 100 usd)...'
            }
            className="w-full bg-transparent text-base sm:text-sm font-semibold text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg hover:bg-[var(--pill-bg)] text-[color:var(--text-muted)]"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Live Quick Converter Card */}
        {converterResult && (
          <div className="p-3.5 mx-3 my-2.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold shrink-0">
                <Calculator size={19} />
              </div>
              <div>
                <div className="text-xs font-semibold text-[color:var(--text-muted)]">
                  {language === 'en' ? 'Live Conversion:' : 'تبدیل لحظه‌ای:'}{' '}
                  {formatNumber(converterResult.amount, 4, language)} {converterResult.name}
                </div>
                <div
                  className="text-base font-extrabold text-[var(--brand-primary)] tabular-nums mt-0.5"
                  dir="ltr"
                >
                  = {formatToman(converterResult.totalToman, language)} {t('common.toman')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewTransaction(converterResult.symbol);
              }}
              className="min-h-[36px] px-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus size={14} />
              <span>{language === 'en' ? 'Log Trade' : 'ثبت معامله'}</span>
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="text-center py-10 text-[color:var(--text-muted)] font-semibold text-xs">
              {language === 'en'
                ? `No matching commands or assets for "${query}".`
                : `نتیجه‌ای برای «${query}» یافت نشد.`}
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 text-start transition-colors ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                      : 'hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--muted-surface)] text-[var(--brand-primary)] border border-[color:var(--border-color)]'
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{item.title}</div>
                      <div
                        className={`text-xs font-medium truncate mt-0.5 tabular-nums ${
                          isSelected ? 'text-white/85' : 'text-[color:var(--text-muted)]'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[var(--pill-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <CornerDownLeft size={14} className="text-white/80" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <footer className="px-4 py-2.5 bg-[var(--muted-surface)] border-t border-[color:var(--border-color)] flex items-center justify-between text-xs text-[color:var(--text-muted)] font-semibold">
          <div className="flex items-center gap-3">
            <span>
              {language === 'en' ? 'Navigate:' : 'ناوبری:'}{' '}
              <kbd className="font-mono bg-[var(--card-bg)] px-1.5 py-0.5 rounded border border-[color:var(--border-color)]">
                ↑↓
              </kbd>
            </span>
            <span>
              {language === 'en' ? 'Select:' : 'انتخاب:'}{' '}
              <kbd className="font-mono bg-[var(--card-bg)] px-1.5 py-0.5 rounded border border-[color:var(--border-color)]">
                ↵
              </kbd>
            </span>
          </div>
          <span className="hidden sm:inline">Zarfolio Quick Command</span>
        </footer>
      </div>
    </div>
  );
};
