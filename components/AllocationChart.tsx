import React, { memo, useState } from 'react';
import { PortfolioSummary, getAssetDetail } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface AllocationChartProps {
  summary: PortfolioSummary;
}

// Bullion Precision palette (Gold, Blue, Emerald, Cyan, Orange, Slate)
const COLORS = ['#f59e0b', '#2563eb', '#10b981', '#0ea5e9', '#ea580c', '#64748b'];

const AllocationChartComponent: React.FC<AllocationChartProps> = ({ summary }) => {
  const { t, language } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!summary || summary.assets.length === 0) return null;

  const data = summary.assets
    .filter((a) => a.allocationPercent > 1)
    .map((a) => ({
      name: getAssetDetail(a.symbol, language).name,
      value: a.currentValueToman,
      percent: a.allocationPercent,
      symbol: a.symbol,
    }));

  const smallAssets = summary.assets.filter((a) => a.allocationPercent <= 1);
  if (smallAssets.length > 0) {
    const otherValue = smallAssets.reduce((sum, a) => sum + a.currentValueToman, 0);
    const otherPercent = smallAssets.reduce((sum, a) => sum + a.allocationPercent, 0);
    data.push({
      name: language === 'en' ? 'Other Assets' : 'سایر دارایی‌ها',
      value: otherValue,
      percent: otherPercent,
      symbol: 'OTH',
    });
  }

  // Native SVG Donut geometry (cx=70, cy=70, r=52)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const activeSlice = hoveredIdx !== null ? data[hoveredIdx] : data[0];

  return (
    <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[20px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
            <PieChartIcon size={17} />
          </div>
          <h3 className="text-sm font-bold text-[color:var(--text-primary)]">
            {t('assetAllocation')}
          </h3>
        </div>
        <span className="text-xs font-semibold text-[color:var(--text-muted)] tabular-nums">
          {formatNumber(summary.assets.length, 0, language)} {language === 'en' ? 'Assets' : 'دارایی'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative w-[144px] h-[144px] shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--muted-surface)"
              strokeWidth="16"
            />
            {data.map((slice, idx) => {
              const pct = Math.max(slice.percent, 0.5);
              const gap = data.length > 1 ? 1.5 : 0;
              const strokeLen = Math.max((pct / 100) * circumference - gap, 1);
              const dashArray = `${strokeLen} ${circumference - strokeLen}`;
              const dashOffset = -(cumulativePercent / 100) * circumference;
              cumulativePercent += slice.percent;
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={slice.symbol + idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={isHovered ? 19 : 16}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  className="transition-[stroke-width,opacity] duration-150 cursor-pointer"
                  style={{ opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1 }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>
          {activeSlice && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
              <span className="text-xs text-[color:var(--text-muted)] font-medium truncate max-w-[84px]">
                {activeSlice.name}
              </span>
              <span className="text-sm font-extrabold text-[color:var(--text-primary)] tabular-nums mt-0.5" dir="ltr">
                {Math.round(activeSlice.percent)}%
              </span>
            </div>
          )}
        </div>

        <div className="w-full flex-1 space-y-2">
          {data.slice(0, 6).map((entry, index) => (
            <div
              key={entry.symbol + index}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[var(--muted-surface)] transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[color:var(--text-primary)] font-semibold truncate">
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums" dir="ltr">
                <span className="text-[color:var(--text-muted)] hidden xl:inline">
                  {formatToman(entry.value, language)}
                </span>
                <span className="font-bold text-[color:var(--text-primary)]">
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
  return prevProps.summary.assets.every(
    (asset, i) =>
      asset.allocationPercent === nextProps.summary.assets[i]?.allocationPercent &&
      asset.currentValueToman === nextProps.summary.assets[i]?.currentValueToman
  );
});
