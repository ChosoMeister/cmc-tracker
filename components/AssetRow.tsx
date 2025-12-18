import React from 'react';
import { AssetSummary, ASSET_DETAILS } from '../types';
import { formatToman, formatPercent, formatNumber, getAssetIconUrl } from '../utils/formatting';
import { ChevronLeft } from 'lucide-react';

interface AssetRowProps {
  asset: AssetSummary;
  onClick: () => void;
}

export const AssetRow: React.FC<AssetRowProps> = ({ asset, onClick }) => {
  const isProfit = asset.pnlToman >= 0;
  const iconUrl = getAssetIconUrl(asset.symbol);

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-50 p-1 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {iconUrl ? (
            <img src={iconUrl} alt={asset.symbol} className="w-full h-full object-cover" />
          ) : (
             <span className="text-xs font-bold text-gray-500">{asset.symbol[0]}</span>
          )}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
            {ASSET_DETAILS[asset.symbol].name}
            <span className="text-[10px] text-gray-400 font-normal">({asset.symbol})</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5" dir="ltr">
            {formatNumber(asset.totalQuantity, 4)} {asset.type === 'GOLD' ? 'gr' : ''}
          </div>
        </div>
      </div>

      <div className="text-left flex flex-col items-end">
        <div className="font-bold text-gray-900 text-sm">{formatToman(asset.currentValueToman)} ت</div>
        <div className={`text-xs flex items-center gap-1 mt-0.5 ${isProfit ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
          <span>{formatPercent(asset.pnlPercent)}</span>
          <span className="opacity-80">({formatToman(Math.abs(asset.pnlToman))})</span>
        </div>
      </div>
    </div>
  );
};