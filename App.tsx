
import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { AssetRow } from './components/AssetRow';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { Transaction, PriceData, PortfolioSummary, ASSET_DETAILS, AssetSummary } from './types';
import * as Storage from './services/storage';
import * as PriceService from './services/priceService';
import * as AuthService from './services/authService';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, LogOut, Shield, Settings } from 'lucide-react';
import { formatToman, formatNumber, formatPercent } from './utils/formatting';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isAuthenticated());
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      setTransactions(Storage.getTransactions());
      refreshPrices();
    }
  }, [isLoggedIn]);

  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const data = await PriceService.fetchPrices();
      setPrices(data);
    } catch (err) {
      console.error("Price fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
  };

  const handleSaveTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: Math.random().toString(36).substr(2, 9) };
    const updated = Storage.saveTransaction(newTx as Transaction);
    setTransactions(updated);
  };

  const portfolioSummary: PortfolioSummary = useMemo(() => {
    if (!prices || transactions.length === 0) return {
      totalValueToman: 0,
      totalCostBasisToman: 0,
      totalPnlToman: 0,
      totalPnlPercent: 0,
      assets: []
    };

    const currentPriceMap: Record<string, number> = {
      USD: prices.usdToToman,
      EUR: prices.eurToToman,
      GOLD18: prices.gold18ToToman,
    };
    
    Object.entries(prices.cryptoUsdPrices).forEach(([symbol, usdPrice]) => {
      currentPriceMap[symbol] = usdPrice * prices.usdToToman;
    });

    const assetsMap: Record<string, AssetSummary> = {};

    transactions.forEach(tx => {
      const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman } = tx;
      
      if (!assetsMap[assetSymbol]) {
        assetsMap[assetSymbol] = {
          symbol: assetSymbol,
          name: ASSET_DETAILS[assetSymbol].name,
          type: ASSET_DETAILS[assetSymbol].type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[assetSymbol] || 0,
          currentValueToman: 0,
          costBasisToman: 0,
          pnlToman: 0,
          pnlPercent: 0,
          allocationPercent: 0,
        };
      }

      const asset = assetsMap[assetSymbol];
      asset.totalQuantity += quantity;
      
      let txCostToman = 0;
      if (buyCurrency === 'TOMAN') {
        txCostToman = (quantity * buyPricePerUnit) + feesToman;
      } else {
        txCostToman = (quantity * buyPricePerUnit * prices.usdToToman) + feesToman;
      }
      asset.costBasisToman += txCostToman;
    });

    let runningTotalValue = 0;
    let runningTotalCost = 0;

    const assets = Object.values(assetsMap).map(asset => {
      asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
      asset.pnlToman = asset.currentValueToman - asset.costBasisToman;
      asset.pnlPercent = asset.costBasisToman > 0 ? (asset.pnlToman / asset.costBasisToman) * 100 : 0;
      
      runningTotalValue += asset.currentValueToman;
      runningTotalCost += asset.costBasisToman;
      return asset;
    });

    assets.forEach(a => {
      a.allocationPercent = runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0;
    });

    const totalPnl = runningTotalValue - runningTotalCost;
    const totalPnlPct = runningTotalCost > 0 ? (totalPnl / runningTotalCost) * 100 : 0;

    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: totalPnl,
      totalPnlPercent: totalPnlPct,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman)
    };
  }, [transactions, prices]);

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const filteredAssets = portfolioSummary.assets.filter(a => 
    a.name.includes(searchQuery) || a.symbol.includes(searchQuery.toUpperCase())
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  const renderOverview = () => {
    const bestAsset = [...portfolioSummary.assets].sort((a, b) => b.pnlPercent - a.pnlPercent)[0];
    const worstAsset = [...portfolioSummary.assets].sort((a, b) => a.pnlPercent - b.pnlPercent)[0];

    return (
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-center mb-2 px-1">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                 <Shield size={16} className="text-white" />
              </div>
              <span className="font-black text-gray-900 text-lg tracking-tight">پنل مدیریت</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-bold transition-colors bg-rose-50 px-3 py-2 rounded-xl"
              >
                  <span>خروج</span>
                  <LogOut size={14} />
              </button>
           </div>
        </div>

        <SummaryCard 
          summary={portfolioSummary} 
          isRefreshing={isRefreshing} 
          lastUpdated={prices?.fetchedAt || Date.now()}
          onRefresh={refreshPrices}
        />
        
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                <ArrowUpRight size={14} />
                <span>بهترین عملکرد</span>
              </div>
              {bestAsset ? (
                 <div className="mt-2">
                    <div className="font-bold text-gray-800 text-sm truncate">{bestAsset.name}</div>
                    <div className="text-emerald-500 text-xs font-black mt-0.5" dir="ltr">
                       {formatPercent(bestAsset.pnlPercent)}
                    </div>
                 </div>
              ) : <div className="text-gray-300 text-xs mt-2">دیتا موجود نیست</div>}
           </div>
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                <ArrowDownRight size={14} />
                <span>ضعیف‌ترین عملکرد</span>
              </div>
               {worstAsset ? (
                 <div className="mt-2">
                    <div className="font-bold text-gray-800 text-sm truncate">{worstAsset.name}</div>
                    <div className={`text-xs font-black mt-0.5 ${worstAsset.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">
                       {formatPercent(worstAsset.pnlPercent)}
                    </div>
                 </div>
              ) : <div className="text-gray-300 text-xs mt-2">دیتا موجود نیست</div>}
           </div>
        </div>

        {portfolioSummary.assets.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[2px] pr-2 border-r-2 border-blue-500">توزیع سبد دارایی</h3>
            <div className="flex items-center">
              <div className="h-40 w-40 shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={portfolioSummary.assets as any[]}
                       dataKey="currentValueToman"
                       cx="50%"
                       cy="50%"
                       innerRadius={45}
                       outerRadius={65}
                       paddingAngle={4}
                       stroke="none"
                     >
                       {portfolioSummary.assets.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 pr-4">
                 {portfolioSummary.assets.slice(0, 4).map((asset, idx) => (
                   <div key={asset.symbol} className="flex items-center justify-between text-[11px]">
                     <div className="flex items-center gap-2 truncate">
                       <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                       <span className="text-gray-600 font-medium truncate">{asset.name}</span>
                     </div>
                     <span className="font-bold text-gray-900">{Math.round(asset.allocationPercent)}%</span>
                   </div>
                 ))}
                 {portfolioSummary.assets.length > 4 && (
                    <div className="text-[10px] text-gray-400 pr-4 mt-1">و سایر موارد...</div>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHoldings = () => (
    <div className="animate-in fade-in duration-300">
      <div className="sticky top-0 bg-white z-40 px-4 py-3 shadow-sm border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="جستجو در دارایی‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
          />
        </div>
        <button onClick={handleLogout} className="p-2.5 bg-gray-100 rounded-2xl text-rose-500">
           <LogOut size={20} />
        </button>
      </div>
      
      <div className="pb-24">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <Filter size={48} className="mb-4 opacity-10" />
             <p className="text-sm font-medium">دارایی یافت نشد</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <AssetRow 
              key={asset.symbol} 
              asset={asset} 
              onClick={() => {}} 
            />
          ))
        )}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="p-4 pb-24 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-xl font-black text-gray-900">تاریخچه تراکنش‌ها</h2>
        <button onClick={handleLogout} className="p-2 bg-gray-50 text-gray-400 rounded-xl">
           <LogOut size={16} />
        </button>
      </div>
      
      {transactions.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-16 text-gray-300 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Plus size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">هنوز تراکنشی ثبت نشده است</p>
         </div>
      ) : (
        <div className="space-y-3">
          {[...transactions].reverse().map(tx => (
            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ASSET_DETAILS[tx.assetSymbol].type === 'CRYPTO' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                   <span className="font-black text-xs">{tx.assetSymbol.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-800">{ASSET_DETAILS[tx.assetSymbol].name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5" dir="ltr">{new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}</div>
                </div>
              </div>
              <div className="text-left">
                <div className="font-black text-sm text-gray-900" dir="ltr">
                  +{formatNumber(tx.quantity)} <span className="text-[10px] text-gray-400">{tx.assetSymbol}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 font-medium" dir="ltr">
                  @ {formatNumber(tx.buyPricePerUnit)} {tx.buyCurrency === 'USD' ? '$' : 'T'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      {tab === 'overview' && renderOverview()}
      {tab === 'holdings' && renderHoldings()}
      {tab === 'transactions' && renderTransactions()}
      
      <BottomNav currentTab={tab} onTabChange={setTab} />

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 left-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 shadow-xl shadow-blue-600/30 transition-all active:scale-90 hover:scale-110 z-50"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </Layout>
  );
}
