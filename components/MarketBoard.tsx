import React, { useState, useMemo } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Coins, 
  DollarSign, 
  Zap, 
  Calculator,
  X
} from 'lucide-react';
import { PriceData, AssetSymbol, AssetType, allAssets, getAssetDetail } from '../types';
import { formatToman, formatPercent, getAssetIconUrl, getAssetFallbackIcon } from '../utils/formatting';
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
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  // Generate all market items with current live prices
  const marketItems: MarketTileItem[] = useMemo(() => {
    if (!prices) return [];

    const goldMap = prices.goldPricesToman || {};
    const fiatMap = prices.fiatPricesToman || {};
    const cryptoMap = prices.cryptoPricesToman || {};
    const changes = prices.changes24h || {};

    const items: MarketTileItem[] = [];

    // Unique symbols to prevent duplicates
    const seen = new Set<string>();

    allAssets.forEach((asset) => {
      if (seen.has(asset.symbol)) return;
      seen.add(asset.symbol);

      let priceToman = 0;
      let change24h: number | undefined = changes[asset.symbol];

      if (asset.type === 'GOLD') {
        priceToman = goldMap[asset.symbol] || (asset.symbol === 'GOLD18' ? prices.gold18ToToman : 0);
        if (change24h === undefined) {
          if (asset.symbol === 'GOLD18' || asset.symbol === '18AYAR') change24h = changes['IR_GOLD_18K'];
          else if (asset.symbol === 'SEKKEH') change24h = changes['IR_COIN_EMAMI'];
          else if (asset.symbol === 'BAHAR') change24h = changes['IR_COIN_BAHAR'];
          else if (asset.symbol === 'NIM') change24h = changes['IR_COIN_HALF'];
          else if (asset.symbol === 'ROB') change24h = changes['IR_COIN_QUARTER'];
          else if (asset.symbol === 'SEK') change24h = changes['IR_COIN_1G'];
          else if (asset.symbol === 'ABSHODEH') change24h = changes['IR_GOLD_MELTED'];
        }
      } else if (asset.type === 'FIAT') {
        priceToman = fiatMap[asset.symbol] || (asset.symbol === 'USD' ? prices.usdToToman : asset.symbol === 'EUR' ? prices.eurToToman : 0);
      } else if (asset.type === 'CRYPTO') {
        priceToman = cryptoMap[asset.symbol] || 0;
      }

      // Only display items that have an active price
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

  // Filter and Sort Items
  const filteredAndSortedItems = useMemo(() => {
    let result = marketItems;

    // Filter by Category
    if (category !== 'ALL') {
      result = result.filter((item) => item.type === category);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q)
      );
    }

    // Sort items
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
  }, [marketItems, category, searchQuery, sortBy]);

  // Count per category
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
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-black text-lg sm:text-2xl text-slate-900 dark:text-white">
                {t('market.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                {t('market.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {lastUpdatedFormatted && (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full" dir="ltr">
              {t('common.updated')}: {lastUpdatedFormatted}
            </span>
          )}

          <button
            onClick={() => {
              haptic('light');
              onRefreshPrices();
            }}
            disabled={isPriceUpdating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isPriceUpdating ? 'animate-spin' : ''} />
            <span>{isPriceUpdating ? t('common.loading') : t('market.refreshPrices')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
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
                onClick={() => handleSelectCategory(tab.id as MarketCategory)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {Icon && <Icon size={14} />}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search size={15} className={`absolute ${language === 'en' ? 'left-3' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('market.searchPlaceholder')}
              className={`w-full ${language === 'en' ? 'pl-9 pr-8' : 'pl-8 pr-10'} py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${language === 'en' ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600`}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              haptic('selection');
              setSortBy(e.target.value as SortOption);
            }}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="DEFAULT">{t('market.sortDefault')}</option>
            <option value="GAINERS">{t('market.sortGainers')}</option>
            <option value="LOSERS">{t('market.sortLosers')}</option>
            <option value="PRICE_DESC">{t('market.sortPriceDesc')}</option>
            <option value="PRICE_ASC">{t('market.sortPriceAsc')}</option>
          </select>
        </div>

      </div>

      {/* Grid of Tiles (Bento Grid) */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-8">
          <p className="text-sm font-bold text-slate-400">{t('market.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
          {filteredAndSortedItems.map((item) => {
            const hasChange = typeof item.change24h === 'number';
            const isPositive = (item.change24h ?? 0) >= 0;
            const isGold = item.type === 'GOLD';

            return (
              <div
                key={item.symbol}
                className="group relative bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Top: Icon + Names + 24h Change Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-1.5 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <img
                          src={item.iconUrl}
                          alt={item.symbol}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAssetFallbackIcon(item.symbol);
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                          {item.symbol}
                        </span>
                      </div>
                    </div>

                    {/* 24h Change Pill */}
                    {hasChange && (
                      <div
                        dir="ltr"
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 ring-1 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20'
                        }`}
                        title={language === 'en' ? '24h Change' : 'تغییرات ۲۴ ساعته'}
                      >
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>{isPositive ? '+' : ''}{formatPercent(item.change24h!, language)}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Big Price Display */}
                  <div className="my-3">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t('market.livePrice')}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">
                        {formatToman(item.priceToman, language)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{t('common.toman')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  {isGold && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic('selection');
                        onOpenGoldBubble();
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-black text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 transition-colors"
                      title={t('market.bubbleCalc')}
                    >
                      <Calculator size={13} />
                      <span>{t('market.bubble')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      haptic('light');
                      onOpenNewTxWithAsset(item.symbol);
                    }}
                    className={`${language === 'en' ? 'ml-auto' : 'mr-auto'} px-3 py-1.5 rounded-xl text-[11px] font-black bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors`}
                    title={t('market.addToPortfolio')}
                  >
                    <Plus size={13} />
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
