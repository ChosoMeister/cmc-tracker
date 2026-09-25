
import React, { useEffect, useState, memo } from 'react';
import { AssetSummary, getAssetDetail } from '../types';
import { formatToman, formatPercent, formatNumber, getAssetFallbackIcon, getAssetIconUrl } from '../utils/formatting';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface AssetRowProps {
  asset: AssetSummary;
  onClick: () => void;
}

const AssetRowComponent: React.FC<AssetRowProps> = ({ asset, onClick }) => {
  const { t, language } = useTranslation();
  const isProfit = asset.pnlToman >= 0;
  const [iconUrl, setIconUrl] = useState(getAssetIconUrl(asset.symbol));
  const mutedText = 'text-[color:var(--text-muted)]';
  const assetDetail = getAssetDetail(asset.symbol, language);
  const tomanSuffix = language === 'en' ? 'T' : 'ت';

  useEffect(() => {
    setIconUrl(getAssetIconUrl(asset.symbol));
  }, [asset.symbol]);

  return (
    <div
      onClick={onClick}
      className="stagger-item hover-lift spring-smooth bg-[var(--card-bg)] text-[color:var(--text-primary)] p-5 flex items-center justify-between border-b border-[color:var(--border-color)] active:bg-[color:var(--muted-surface)] cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[color:var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          <img
            src={iconUrl}
            alt={asset.symbol}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setIconUrl(getAssetFallbackIcon(asset.symbol))}
          />
        </div>
        <div>
          <div className="font-black text-[color:var(--text-primary)] text-sm flex items-center gap-1.5">
            {assetDetail.name}
            <span className="text-[10px] bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] px-1.5 py-0.5 rounded-md font-bold">{asset.symbol}</span>
          </div>
          <div className={`text-[11px] ${mutedText} mt-1 font-bold flex items-center gap-1`} dir="ltr">
            <span>{formatNumber(asset.totalQuantity, 3, language)}</span>
            <span className="opacity-60">{asset.type === 'GOLD' ? (language === 'en' ? 'g' : 'گرم') : asset.symbol}</span>
          </div>
          {/* Live unit price and 24h change */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-black flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <span>{language === 'en' ? 'Unit:' : 'واحد:'}</span>
              <span dir="ltr">{formatToman(asset.currentPriceToman, language)} {tomanSuffix}</span>
            </div>
            {typeof asset.change24h === 'number' && (
              <span
                dir="ltr"
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ring-1 transition-colors ${
                  asset.change24h >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20'
                }`}
                title={language === 'en' ? '24h Market Change' : 'تغییرات ۲۴ ساعت گذشته بازار'}
              >
                {asset.change24h >= 0 ? '+' : ''}{formatPercent(asset.change24h, language)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-left flex flex-col items-end">
        <div className="font-black text-[color:var(--text-primary)] text-sm">{formatToman(asset.currentValueToman, language)} {tomanSuffix}</div>
        <div className={`text-[10px] flex items-center gap-1 mt-1.5 font-black px-2 py-1 rounded-lg ${isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`} dir="ltr">
          {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{formatPercent(asset.pnlPercent, language)}</span>
        </div>
        <div className={`text-[9px] ${mutedText} mt-1 font-bold`} dir="ltr">
          {language === 'en' ? 'PnL: ' : 'سود/ضرر: '}{formatToman(asset.pnlToman, language)} {tomanSuffix}
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when props haven't changed
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
