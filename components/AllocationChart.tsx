import React, { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioSummary, getAssetDetail } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface AllocationChartProps {
  summary: PortfolioSummary;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const AllocationChartComponent: React.FC<AllocationChartProps> = ({ summary }) => {
  const { t, language } = useTranslation();
  if (!summary || summary.assets.length === 0) return null;

  const data = summary.assets
    .filter(a => a.allocationPercent > 1)
    .map(a => ({
      name: getAssetDetail(a.symbol, language).name,
      value: a.currentValueToman,
      percent: a.allocationPercent,
      symbol: a.symbol
    }));

  const smallAssets = summary.assets.filter(a => a.allocationPercent <= 1);
  if (smallAssets.length > 0) {
    const otherValue = smallAssets.reduce((sum, a) => sum + a.currentValueToman, 0);
    const otherPercent = smallAssets.reduce((sum, a) => sum + a.allocationPercent, 0);
    data.push({
      name: language === 'en' ? 'Other Assets' : 'سایر موارد',
      value: otherValue,
      percent: otherPercent,
      symbol: 'OTH'
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-2xl shadow-xl text-right z-50">
          <p className="font-black text-white text-xs mb-1">{d.name}</p>
          <div className="flex items-center gap-2 justify-end text-[10px]" dir="ltr">
            <span className="text-emerald-400 font-black">{formatPercent(d.percent, language)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-bold">{formatToman(d.value, language)} {language === 'en' ? 'T' : 'ت'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--card-bg)] border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <PieChartIcon size={18} />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
            {t('assetAllocation')}
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {formatNumber(summary.assets.length, 0, language)} {language === 'en' ? 'Assets' : 'دارایی'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:w-1/2 space-y-2.5">
          {data.slice(0, 5).map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-bold truncate">
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0" dir="ltr">
                <span className="font-black text-slate-800 dark:text-slate-100">
                  {Math.round(entry.percent)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AllocationChart = memo(AllocationChartComponent, (prevProps, nextProps) => {
  if (prevProps.summary.assets.length !== nextProps.summary.assets.length) return false;
  return prevProps.summary.assets.every((asset, i) =>
    asset.allocationPercent === nextProps.summary.assets[i]?.allocationPercent &&
    asset.currentValueToman === nextProps.summary.assets[i]?.currentValueToman
  );
});
