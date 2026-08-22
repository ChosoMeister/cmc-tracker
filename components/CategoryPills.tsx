import React from 'react';
import { AssetSummary, AssetType } from '../types';
import { formatPercent, formatToman } from '../utils/formatting';
import { Coins, CircleDollarSign, Bitcoin, Layers } from 'lucide-react';

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
  // Aggregate stats per category
  const stats = React.useMemo(() => {
    const goldAssets = assets.filter(a => a.type === 'GOLD');
    const cryptoAssets = assets.filter(a => a.type === 'CRYPTO');
    const fiatAssets = assets.filter(a => a.type === 'FIAT');

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
    color: string;
    activeClass: string;
  }> = [
    {
      key: 'ALL',
      label: 'همه دارایی‌ها',
      icon: <Layers size={14} />,
      color: 'text-blue-500',
      activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    },
    {
      key: 'GOLD',
      label: 'طلا و مسکوکات',
      icon: <Coins size={14} />,
      color: 'text-amber-500',
      activeClass: 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20',
    },
    {
      key: 'CRYPTO',
      label: 'ارز دیجیتال',
      icon: <Bitcoin size={14} />,
      color: 'text-indigo-500',
      activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
    },
    {
      key: 'FIAT',
      label: 'ارزهای فیات',
      icon: <CircleDollarSign size={14} />,
      color: 'text-emerald-500',
      activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => {
          const isActive = activeCategory === cat.key;
          const count = cat.key === 'ALL' ? stats.ALL.count : stats[cat.key].count;
          
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
                isActive
                  ? cat.activeClass
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              <span className={isActive ? '' : cat.color}>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Category Summary Card (if not ALL) */}
      {activeCategory !== 'ALL' && stats[activeCategory].count > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div>
            <span className="text-slate-400 font-bold block text-[10px]">مجموع ارزش این دسته</span>
            <span className="font-black text-slate-800 dark:text-white text-sm">
              {formatToman(stats[activeCategory].val)} <span className="text-[10px] text-slate-400">تومان</span>
            </span>
          </div>

          <div className="text-left">
            <span className="text-slate-400 font-bold block text-[10px]">سود / زیان دسته</span>
            <span className={`font-black text-xs ${stats[activeCategory].pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatPercent(stats[activeCategory].pnlPct)} ({stats[activeCategory].pnl >= 0 ? '+' : ''}{formatToman(stats[activeCategory].pnl)} ت)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
