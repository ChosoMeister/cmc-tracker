import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Coins,
  DollarSign,
  Zap,
  Calculator,
  X,
  BarChart3,
} from 'lucide-react';
import { PriceData, AssetSymbol, AssetType, allAssets, getAssetDetail } from '../types';
import {
  formatToman,
  formatPercent,
  getAssetIconUrl,
  getAssetFallbackIcon,
} from '../utils/formatting';
import { useHaptics } from '../hooks/useHaptics';
import { useTranslation } from '../contexts/LanguageContext';

interface MarketBoardProps {
  prices: PriceData | null;
  onRefreshPrices: () => void;
  isPriceUpdating: boolean;
  onOpenNewTxWithAsset: (symbol: AssetSymbol) => void;
  onOpenGoldBubble: () => void;
}

type MarketCategory = 'ALL' | 'GOLD' | 'FIAT' | 'CRYPTO';
type SortOption = 'DEFAULT' | 'GAINERS' | 'LOSERS' | 'PRICE_DESC' | 'PRICE_ASC';

interface MarketTileItem {
  symbol: AssetSymbol;
  name: string;
  type: AssetType;
  priceToman: number;
  change24h?: number;
  iconUrl: string;
}

export const MarketBoard: React.FC<MarketBoardProps> = ({
  prices,
  onRefreshPrices,
  isPriceUpdating,
  onOpenNewTxWithAsset,
  onOpenGoldBubble,
}) => {
  const { t, language } = useTranslation();
  const { haptic } = useHaptics();
  const [category, setCategory] = useState<MarketCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  const marketItems: MarketTileItem[] = useMemo(() => {
    if (!prices) return [];

    const goldMap = prices.goldPricesToman || {};
    const fiatMap = prices.fiatPricesToman || {};
    const cryptoMap = prices.cryptoPricesToman || {};
    const changes = prices.changes24h || {};

    const items: MarketTileItem[] = [];
    const seen = new Set<string>();

    allAssets.forEach((asset) => {
      if (asset.symbol === '18AYAR') return; // Avoid duplicate 18K Gold tile next to GOLD18
      if (seen.has(asset.symbol)) return;
      seen.add(asset.symbol);

      let priceToman = 0;
      let change24h: number | undefined = changes[asset.symbol];

      if (asset.type === 'GOLD') {
        priceToman =
          goldMap[asset.symbol] ||
          (asset.symbol === 'GOLD18' ? prices.gold18ToToman : 0) ||
          (asset.symbol === 'GRAM_COIN' ? goldMap.GERAMI || goldMap.SEK || 0 : 0);

        if (change24h === undefined) {
          if (asset.symbol === 'GOLD18') change24h = changes['IR_GOLD_18K'];
          else if (asset.symbol === 'SEKKEH') change24h = changes['IR_COIN_EMAMI'];
          else if (asset.symbol === 'BAHAR') change24h = changes['IR_COIN_BAHAR'];
          else if (asset.symbol === 'NIM') change24h = changes['IR_COIN_HALF'];
          else if (asset.symbol === 'ROB') change24h = changes['IR_COIN_QUARTER'];
          else if (asset.symbol === 'GRAM_COIN') change24h = changes['IR_COIN_1G'] ?? changes['GERAMI'];
          else if (asset.symbol === 'ABSHODEH') change24h = changes['IR_GOLD_MELTED'];
        }
      } else if (asset.type === 'FIAT') {
        priceToman =
          fiatMap[asset.symbol] ||
          (asset.symbol === 'USD'
            ? prices.usdToToman
            : asset.symbol === 'EUR'
              ? prices.eurToToman
              : 0);
      } else if (asset.type === 'CRYPTO') {
        priceToman = cryptoMap[asset.symbol] || 0;
      }

      if (priceToman > 0) {
        items.push({
          symbol: asset.symbol,
          name: getAssetDetail(asset.symbol, language).name,
          type: asset.type,
          priceToman,
          change24h,
          iconUrl: getAssetIconUrl(asset.symbol),
        });
      }
    });

    return items;
  }, [prices, language]);

  const filteredAndSortedItems = useMemo(() => {
    let result = marketItems;

    if (category !== 'ALL') {
      result = result.filter((item) => item.type === category);
    }

    if (deferredQuery.trim()) {
      const q = deferredQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'GAINERS':
        return sorted.sort((a, b) => (b.change24h ?? -999) - (a.change24h ?? -999));
      case 'LOSERS':
        return sorted.sort((a, b) => (a.change24h ?? 999) - (b.change24h ?? 999));
      case 'PRICE_DESC':
        return sorted.sort((a, b) => b.priceToman - a.priceToman);
      case 'PRICE_ASC':
        return sorted.sort((a, b) => a.priceToman - b.priceToman);
      default:
        return sorted;
    }
  }, [marketItems, category, deferredQuery, sortBy]);

  const categoryCounts = useMemo(() => {
    return {
      ALL: marketItems.length,
      GOLD: marketItems.filter((i) => i.type === 'GOLD').length,
      FIAT: marketItems.filter((i) => i.type === 'FIAT').length,
      CRYPTO: marketItems.filter((i) => i.type === 'CRYPTO').length,
    };
  }, [marketItems]);

  const handleSelectCategory = (cat: MarketCategory) => {
    haptic('selection');
    setCategory(cat);
  };

  const lastUpdatedFormatted = useMemo(() => {
    if (!prices?.fetchedAt) return '';
    const dateLocale = language === 'en' ? 'en-US' : 'fa-IR';
    return new Date(prices.fetchedAt).toLocaleTimeString(dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [prices?.fetchedAt, language]);

  return (
    <div className="space-y-5 pb-16 animate-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-xl text-[color:var(--text-primary)]">
              {t('market.title')}
            </h1>
            <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
              {t('market.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {lastUpdatedFormatted && (
            <span
              className="text-xs font-semibold text-[color:var(--text-muted)] bg-[var(--muted-surface)] border border-[color:var(--border-color)] px-3 py-1.5 rounded-lg tabular-nums"
              dir="ltr"
            >
              {t('common.updated')} {lastUpdatedFormatted}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              haptic('light');
              onRefreshPrices();
            }}
            disabled={isPriceUpdating}
            className="min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-gold active:scale-95 transition-transform disabled:opacity-50"
          >
            <RefreshCw size={14} className={isPriceUpdating ? 'animate-spin' : ''} />
            <span>{isPriceUpdating ? t('common.loading') : t('market.refreshPrices')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[var(--muted-surface)] p-1 rounded-xl border border-[color:var(--border-color)] overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: t('market.allSymbols'), icon: null },
            { id: 'GOLD', label: t('market.goldAndCoins'), icon: Coins },
            { id: 'FIAT', label: t('market.fiatCurrencies'), icon: DollarSign },
            { id: 'CRYPTO', label: t('market.cryptocurrencies'), icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = category === tab.id;
            const count = categoryCounts[tab.id as MarketCategory];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectCategory(tab.id as MarketCategory)}
                className={`min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[color:var(--text-primary)] shadow-sm border border-[color:var(--border-color)]'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                {Icon && <Icon size={14} className={isActive ? 'text-[var(--brand-primary)]' : ''} />}
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md tabular-nums ${
                    isActive
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-primary)]'
                      : 'bg-[var(--pill-bg)] text-[color:var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search
              size={15}
              className={`absolute ${
                language === 'en' ? 'left-3.5' : 'right-3.5'
              } top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('market.searchPlaceholder')}
              className={`w-full min-h-[40px] ${
                language === 'en' ? 'pl-9 pr-8' : 'pl-8 pr-10'
              } py-2 text-base sm:text-xs font-semibold rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute ${
                  language === 'en' ? 'right-2.5' : 'left-2.5'
                } top-1/2 -translate-y-1/2 p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]`}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              haptic('selection');
              setSortBy(e.target.value as SortOption);
            }}
            className="min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer"
          >
            <option value="DEFAULT">{t('market.sortDefault')}</option>
            <option value="GAINERS">{t('market.sortGainers')}</option>
            <option value="LOSERS">{t('market.sortLosers')}</option>
            <option value="PRICE_DESC">{t('market.sortPriceDesc')}</option>
            <option value="PRICE_ASC">{t('market.sortPriceAsc')}</option>
          </select>
        </div>
      </div>

      {/* Solid Surface Grid (No 95-card backdrop-blur-xl GPU bottleneck!) */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-14 bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-8">
          <p className="text-sm font-semibold text-[color:var(--text-muted)]">
            {t('market.noResults')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredAndSortedItems.map((item) => {
            const hasChange = typeof item.change24h === 'number';
            const isPositive = (item.change24h ?? 0) >= 0;
            const isGold = item.type === 'GOLD';

            return (
              <div
                key={item.symbol}
                className="group bg-[var(--card-bg)] border border-[color:var(--border-color)] hover:border-[var(--brand-border)] rounded-[20px] p-4 shadow-sm hover-lift flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={item.iconUrl}
                          alt={item.symbol}
                          width={28}
                          height={28}
                          decoding="async"
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAssetFallbackIcon(item.symbol);
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-[color:var(--text-primary)] truncate">
                          {item.name}
                        </h3>
                        <span className="text-xs font-semibold text-[color:var(--text-muted)] bg-[var(--muted-surface)] px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                          {item.symbol}
                        </span>
                      </div>
                    </div>

                    {hasChange && (
                      <div
                        dir="ltr"
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-0.5 tabular-nums shrink-0 ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{formatPercent(item.change24h!, language)}</span>
                      </div>
                    )}
                  </div>

                  <div className="my-3">
                    <span className="text-xs font-medium text-[color:var(--text-muted)] block mb-0.5">
                      {t('market.livePrice')}
                    </span>
                    <div className="flex items-baseline gap-1.5 tabular-nums" dir="ltr">
                      <span className="text-lg font-extrabold text-[color:var(--text-primary)] tracking-tight">
                        {formatToman(item.priceToman, language)}
                      </span>
                      <span className="text-xs font-semibold text-[color:var(--text-muted)]">
                        {t('common.toman')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-[color:var(--border-color)] flex items-center justify-between gap-2">
                  {isGold && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic('selection');
                        onOpenGoldBubble();
                      }}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[var(--muted-surface)] flex items-center gap-1 transition-colors"
                      title={t('market.bubbleCalc')}
                    >
                      <Calculator size={14} />
                      <span>{t('market.bubble')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      haptic('light');
                      onOpenNewTxWithAsset(item.symbol);
                    }}
                    className={`${
                      language === 'en' ? 'ml-auto' : 'mr-auto'
                    } min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--brand-soft)] hover:bg-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-white border border-[var(--brand-border)] flex items-center gap-1 transition-colors`}
                  >
                    <Plus size={14} />
                    <span>{t('market.addToPortfolio')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
