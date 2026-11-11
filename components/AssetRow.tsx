import React, { useEffect, useState, memo } from 'react';
import { AssetSummary, getAssetDetail, isCoinAsset } from '../types';
import {
  formatToman,
  formatPercent,
  formatNumber,
  getAssetFallbackIcon,
  getAssetIconUrl,
} from '../utils/formatting';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface AssetRowProps {
  asset: AssetSummary;
  onClick: () => void;
}

const AssetRowComponent: React.FC<AssetRowProps> = ({ asset, onClick }) => {
  const { language } = useTranslation();
  const isProfit = asset.pnlToman >= 0;
  const [iconUrl, setIconUrl] = useState(() => getAssetIconUrl(asset.symbol));
  const assetDetail = getAssetDetail(asset.symbol, language);
  const tomanSuffix = language === 'en' ? 'T' : 'ت';

  useEffect(() => {
    setIconUrl(getAssetIconUrl(asset.symbol));
  }, [asset.symbol]);

  const unitLabel = (() => {
    if (isCoinAsset(asset.symbol)) {
      return language === 'en' ? 'pcs' : 'عدد';
    }
    if (asset.symbol === 'ABSHODEH') {
      return language === 'en' ? 'mithqal' : 'مثقال';
    }
    if (asset.symbol === 'USD_XAU' || asset.symbol === 'XAG') {
      return language === 'en' ? 'oz' : 'انس';
    }
    if (asset.type === 'GOLD') {
      return language === 'en' ? 'g' : 'گرم';
    }
    return asset.symbol;
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-start spring-smooth bg-[var(--card-bg)] hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)] p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-[color:var(--border-color)] last:border-b-0 cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={iconUrl}
            alt={asset.symbol}
            width={32}
            height={32}
            decoding="async"
            loading="lazy"
            className="w-full h-full object-contain"
            onError={() => setIconUrl(getAssetFallbackIcon(asset.symbol))}
          />
        </div>

        <div className="min-w-0">
          <div className="font-bold text-[color:var(--text-primary)] text-sm flex items-center gap-2 flex-wrap">
            <span className="truncate">{assetDetail.name}</span>
            <span className="text-xs bg-[var(--pill-bg)] text-[color:var(--text-muted)] px-1.5 py-0.5 rounded-md font-semibold">
              {asset.symbol}
            </span>
          </div>

          <div className="text-xs text-[color:var(--text-muted)] mt-1 font-semibold flex items-center gap-2 flex-wrap tabular-nums">
            <span dir="ltr">
              {formatNumber(asset.totalQuantity, 4, language)} {unitLabel}
            </span>
            <span>•</span>
            <span dir="ltr">
              {formatToman(asset.currentPriceToman, language)} {tomanSuffix}
            </span>
            {typeof asset.change24h === 'number' && (
              <span
                dir="ltr"
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                  asset.change24h >= 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatPercent(asset.change24h, language)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-end flex flex-col items-end shrink-0 tabular-nums">
        <div className="font-bold text-[color:var(--text-primary)] text-sm" dir="ltr">
          {formatToman(asset.currentValueToman, language)} {tomanSuffix}
        </div>
        <div
          className={`text-xs inline-flex items-center gap-1 mt-1 font-bold px-2 py-0.5 rounded-lg ${
            isProfit
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
          }`}
          dir="ltr"
        >
          {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{formatPercent(asset.pnlPercent, language)}</span>
        </div>
        <div className="text-xs text-[color:var(--text-muted)] mt-0.5 font-medium" dir="ltr">
          {isProfit ? '+' : '-'}
          {formatToman(Math.abs(asset.pnlToman), language)} {tomanSuffix}
        </div>
      </div>
    </button>
  );
};

export const AssetRow = memo(AssetRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.asset.symbol === nextProps.asset.symbol &&
    prevProps.asset.currentValueToman === nextProps.asset.currentValueToman &&
    prevProps.asset.currentPriceToman === nextProps.asset.currentPriceToman &&
    prevProps.asset.pnlToman === nextProps.asset.pnlToman &&
    prevProps.asset.totalQuantity === nextProps.asset.totalQuantity &&
    prevProps.asset.change24h === nextProps.asset.change24h
  );
});
