import React from 'react';
import { AssetSummary } from '../types';
import { formatPercent, formatToman, formatNumber } from '../utils/formatting';
import { Coins, CircleDollarSign, Bitcoin, Layers } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

export type CategoryFilterType = 'ALL' | 'GOLD' | 'CRYPTO' | 'FIAT';

interface CategoryPillsProps {
  activeCategory: CategoryFilterType;
  onSelectCategory: (category: CategoryFilterType) => void;
  assets: AssetSummary[];
  totalPortfolioValue: number;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
  assets,
  totalPortfolioValue,
}) => {
  const { language } = useTranslation();

  const stats = React.useMemo(() => {
    const goldAssets = assets.filter((a) => a.type === 'GOLD');
    const cryptoAssets = assets.filter((a) => a.type === 'CRYPTO');
    const fiatAssets = assets.filter((a) => a.type === 'FIAT');

    const getStats = (list: AssetSummary[]) => {
      const val = list.reduce((acc, a) => acc + a.currentValueToman, 0);
      const cost = list.reduce((acc, a) => acc + a.costBasisToman, 0);
      const pnl = val - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      const count = list.length;
      return { val, cost, pnl, pnlPct, count };
    };

    return {
      ALL: {
        val: totalPortfolioValue,
        count: assets.length,
      },
      GOLD: getStats(goldAssets),
      CRYPTO: getStats(cryptoAssets),
      FIAT: getStats(fiatAssets),
    };
  }, [assets, totalPortfolioValue]);

  const categories: Array<{
    key: CategoryFilterType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'ALL',
      label: language === 'en' ? 'All Assets' : 'همه دارایی‌ها',
      icon: <Layers size={15} />,
    },
    {
      key: 'GOLD',
      label: language === 'en' ? 'Gold & Coins' : 'طلا و مسکوکات',
      icon: <Coins size={15} />,
    },
    {
      key: 'CRYPTO',
      label: language === 'en' ? 'Crypto' : 'ارز دیجیتال',
      icon: <Bitcoin size={15} />,
    },
    {
      key: 'FIAT',
      label: language === 'en' ? 'Fiat Currencies' : 'ارزهای فیات',
      icon: <CircleDollarSign size={15} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          const count = cat.key === 'ALL' ? stats.ALL.count : stats[cat.key].count;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                isActive
                  ? 'bg-[var(--brand-primary)] text-white shadow-gold'
                  : 'bg-[var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] border border-[color:var(--border-color)]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md tabular-nums ${
                  isActive
                    ? 'bg-black/20 text-white'
                    : 'bg-[var(--muted-surface)] text-[color:var(--text-muted)]'
                }`}
              >
                {formatNumber(count, 0, language)}
              </span>
            </button>
          );
        })}
      </div>

      {activeCategory !== 'ALL' && stats[activeCategory].count > 0 && (
        <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs animate-in">
          <div>
            <span className="text-[color:var(--text-muted)] font-semibold block text-xs">
              {language === 'en' ? 'Category Total Value' : 'مجموع ارزش این دسته'}
            </span>
            <span className="font-bold text-[color:var(--text-primary)] text-sm tabular-nums mt-0.5 block" dir="ltr">
              {formatToman(stats[activeCategory].val, language)}{' '}
              <span className="text-xs text-[color:var(--text-muted)]">
                {language === 'en' ? 'Toman' : 'تومان'}
              </span>
            </span>
          </div>

          <div className="text-end">
            <span className="text-[color:var(--text-muted)] font-semibold block text-xs">
              {language === 'en' ? 'Category PnL' : 'سود / زیان دسته'}
            </span>
            <span
              className={`font-bold text-xs tabular-nums mt-0.5 block ${
                stats[activeCategory].pnl >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
              dir="ltr"
            >
              {formatPercent(stats[activeCategory].pnlPct, language)} (
              {stats[activeCategory].pnl >= 0 ? '+' : ''}
              {formatToman(stats[activeCategory].pnl, language)} {language === 'en' ? 'T' : 'ت'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
