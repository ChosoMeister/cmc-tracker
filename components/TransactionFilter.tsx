import React, { useState, memo } from 'react';
import { Filter, X, Calendar, Search } from 'lucide-react';
import { AssetType } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

export interface TransactionFilters {
  assetType: AssetType | 'ALL';
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
  searchQuery: string;
  wallet?: string;
  tag?: string;
}

interface TransactionFilterProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  availableWallets?: string[];
  availableTags?: string[];
}

const TransactionFilterComponent: React.FC<TransactionFilterProps> = ({
  filters,
  onFiltersChange,
  availableWallets = [],
  availableTags = [],
}) => {
  const { language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const assetTypeOptions: { value: AssetType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: language === 'en' ? 'All' : 'همه' },
    { value: 'GOLD', label: language === 'en' ? 'Gold & Coins' : 'طلا و سکه' },
    { value: 'FIAT', label: language === 'en' ? 'Fiat' : 'ارز فیات' },
    { value: 'CRYPTO', label: language === 'en' ? 'Crypto' : 'رمزارز' },
  ];

  const dateRangeOptions: { value: TransactionFilters['dateRange']; label: string }[] = [
    { value: 'all', label: language === 'en' ? 'All Time' : 'همه زمان‌ها' },
    { value: 'week', label: language === 'en' ? 'Past Week' : 'هفته اخیر' },
    { value: 'month', label: language === 'en' ? 'Past Month' : 'ماه اخیر' },
    { value: 'quarter', label: language === 'en' ? 'Past 3 Months' : '۳ ماه اخیر' },
    { value: 'year', label: language === 'en' ? 'Past Year' : 'سال اخیر' },
  ];

  const hasActiveFilters =
    filters.assetType !== 'ALL' ||
    filters.dateRange !== 'all' ||
    Boolean(filters.wallet) ||
    Boolean(filters.tag);

  const clearFilters = () => {
    onFiltersChange({
      assetType: 'ALL',
      dateRange: 'all',
      searchQuery: filters.searchQuery,
      wallet: undefined,
      tag: undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search & Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className={`absolute ${language === 'en' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none`}
          />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? 'Search symbol, wallet, tag, or note...'
                : 'جستجو در نماد، کیف پول، برچسب یا یادداشت...'
            }
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className={`w-full min-h-[44px] bg-[var(--muted-surface)] rounded-xl py-2.5 ${
              language === 'en' ? 'pl-10 pr-9' : 'pr-10 pl-9'
            } text-base sm:text-xs font-semibold focus:outline-none focus:border-[var(--brand-primary)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition-colors`}
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
              className={`absolute ${language === 'en' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 p-1 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]`}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border transition-colors flex items-center justify-center gap-1.5 text-xs font-bold ${
            hasActiveFilters || isExpanded
              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-gold'
              : 'bg-[var(--muted-surface)] border-[color:var(--border-color)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
          }`}
          aria-expanded={isExpanded}
          aria-label={language === 'en' ? 'Filter transactions' : 'فیلتر تراکنش‌ها'}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">{language === 'en' ? 'Filters' : 'فیلتر'}</span>
        </button>
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="bg-[var(--muted-surface)] rounded-xl p-4 border border-[color:var(--border-color)] space-y-4">
          {/* Asset Type Filter */}
          <div>
            <label className="text-xs font-bold text-[color:var(--text-muted)] mb-2 block">
              {language === 'en' ? 'Asset Category' : 'نوع دارایی'}
            </label>
            <div className="flex flex-wrap gap-2">
              {assetTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, assetType: option.value })}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    filters.assetType === option.value
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                      : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)] hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-xs font-bold text-[color:var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Calendar size={13} />
              <span>{language === 'en' ? 'Date Range' : 'بازه زمانی'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, dateRange: option.value })}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    filters.dateRange === option.value
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                      : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)] hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallets Filter */}
          {availableWallets.length > 0 && (
            <div>
              <label className="text-xs font-bold text-[color:var(--text-muted)] mb-2 block">
                {language === 'en' ? 'Custody / Wallet' : 'محل نگهداری / کیف پول'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, wallet: undefined })}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                    !filters.wallet
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                  }`}
                >
                  {language === 'en' ? 'All' : 'همه'}
                </button>
                {availableWallets.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      onFiltersChange({ ...filters, wallet: filters.wallet === w ? undefined : w })
                    }
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      filters.wallet === w
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-xs font-bold text-[color:var(--text-muted)] mb-2 block">
                {language === 'en' ? 'Tags' : 'برچسب‌ها'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, tag: undefined })}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                    !filters.tag
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                  }`}
                >
                  {language === 'en' ? 'All' : 'همه'}
                </button>
                {availableTags.map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() =>
                      onFiltersChange({ ...filters, tag: filters.tag === tg ? undefined : tg })
                    }
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      filters.tag === tg
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]'
                    }`}
                  >
                    {tg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full min-h-[40px] rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 transition-colors flex items-center justify-center gap-2"
            >
              <X size={14} />
              <span>{language === 'en' ? 'Clear All Filters' : 'پاک کردن فیلترها'}</span>
            </button>
          )}
        </div>
      )}

      {/* Active Filter Chips */}
      {!isExpanded && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.assetType !== 'ALL' && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] inline-flex items-center gap-1.5">
              {assetTypeOptions.find((o) => o.value === filters.assetType)?.label}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, assetType: 'ALL' })}
                aria-label="Remove asset type filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.dateRange !== 'all' && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] inline-flex items-center gap-1.5">
              {dateRangeOptions.find((o) => o.value === filters.dateRange)?.label}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, dateRange: 'all' })}
                aria-label="Remove date filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.wallet && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] inline-flex items-center gap-1.5">
              {filters.wallet}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, wallet: undefined })}
                aria-label="Remove wallet filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.tag && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] inline-flex items-center gap-1.5">
              {filters.tag}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, tag: undefined })}
                aria-label="Remove tag filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const TransactionFilter = memo(TransactionFilterComponent);

export const filterTransactions = <
  T extends {
    assetSymbol: string;
    buyDateTime: string;
    wallet?: string;
    tags?: string[];
    note?: string;
  },
>(
  transactions: T[],
  filters: TransactionFilters,
  getAssetType: (symbol: string) => string
): T[] => {
  return transactions.filter((tx) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const symbolMatch = tx.assetSymbol.toLowerCase().includes(query);
      const walletMatch = tx.wallet?.toLowerCase().includes(query);
      const noteMatch = tx.note?.toLowerCase().includes(query);
      const tagMatch = tx.tags?.some((tg) => tg.toLowerCase().includes(query));

      if (!symbolMatch && !walletMatch && !noteMatch && !tagMatch) {
        return false;
      }
    }

    if (filters.assetType !== 'ALL') {
      const type = getAssetType(tx.assetSymbol);
      if (type !== filters.assetType) {
        return false;
      }
    }

    if (filters.wallet && tx.wallet !== filters.wallet) {
      return false;
    }

    if (filters.tag && (!tx.tags || !tx.tags.includes(filters.tag))) {
      return false;
    }

    if (filters.dateRange !== 'all') {
      const txDate = new Date(tx.buyDateTime);
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          return true;
      }

      if (txDate < startDate) {
        return false;
      }
    }

    return true;
  });
};
