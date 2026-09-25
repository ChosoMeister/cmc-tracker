import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { AllocationChart } from './components/AllocationChart';
import { AssetRow } from './components/AssetRow';
import { SummaryCardSkeleton, AssetRowSkeleton } from './components/Skeleton';
import { EmptyState } from './components/EmptyState';
import { PullToRefresh } from './components/PullToRefresh';
import { LoginPage } from './components/LoginPage';
import { Transaction, PriceData, PortfolioSummary, AssetSummary, getAssetDetail, AssetSymbol } from './types';
import { API } from './services/api';
import * as PriceService from './services/priceService';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  LogOut, 
  Shield, 
  Settings, 
  Sparkles, 
  UserCircle, 
  RefreshCw, 
  Calculator, 
  Download, 
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  PieChart as PieChartIcon,
  History,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatToman, formatNumber, formatPercent } from './utils/formatting';
import * as AuthService from './services/authService';
import { useToast } from './components/Toast';
import { TransactionFilter, TransactionFilters, filterTransactions } from './components/TransactionFilter';
import { useHaptics } from './hooks/useHaptics';
import { useTranslation } from './contexts/LanguageContext';

// Lazy Load Heavy Components
const TransactionModal = lazy(() => import('./components/TransactionModal').then(module => ({ default: module.TransactionModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const SettingsDrawer = lazy(() => import('./components/SettingsDrawer').then(module => ({ default: module.SettingsDrawer })));
const GoldBubbleModal = lazy(() => import('./components/GoldBubbleModal').then(module => ({ default: module.GoldBubbleModal })));
const ExportImportModal = lazy(() => import('./components/ExportImportModal').then(module => ({ default: module.ExportImportModal })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(module => ({ default: module.CommandPalette })));
const DcaCalculatorModal = lazy(() => import('./components/DcaCalculatorModal').then(module => ({ default: module.DcaCalculatorModal })));
const PortfolioHistoryChart = lazy(() => import('./components/PortfolioHistoryChart').then(module => ({ default: module.PortfolioHistoryChart })));
const MarketBoard = lazy(() => import('./components/MarketBoard').then(module => ({ default: module.MarketBoard })));
import { CategoryPills, CategoryFilterType } from './components/CategoryPills';

export default function App() {
  const { t, language } = useTranslation();
  type SessionUser = { username: string; isAdmin: boolean; displayName?: string };
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<{ title: string, uri: string }[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isGoldBubbleOpen, setIsGoldBubbleOpen] = useState(false);
  const [isDcaModalOpen, setIsDcaModalOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [holdingCategory, setHoldingCategory] = useState<CategoryFilterType>('ALL');
  const [defaultAssetForNewTx, setDefaultAssetForNewTx] = useState<AssetSymbol | undefined>(undefined);
  const [txFilters, setTxFilters] = useState<TransactionFilters>({
    assetType: 'ALL',
    dateRange: 'all',
    searchQuery: '',
  });
  const { haptic } = useHaptics();
  const { addToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    return stored || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const fallbackSources = [
    { title: language === 'en' ? 'AlanChand Currency Prices' : 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
    { title: language === 'en' ? 'AlanChand Crypto Prices' : 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
    { title: language === 'en' ? 'TGJU Gold & Currency Network' : 'شبکه اطلاع‌رسانی طلا و ارز', uri: 'https://tgju.org' },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSessionChecked(true);
      return;
    }
    try {
      const stored = localStorage.getItem(AuthService.SESSION_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username && typeof parsed.isAdmin === 'boolean') {
          setUser(parsed);
        } else {
          localStorage.removeItem(AuthService.SESSION_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore session', error);
      localStorage.removeItem(AuthService.SESSION_USER_KEY);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const nextTheme = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      setResolvedTheme(nextTheme);
      document.body.classList.toggle('dark', nextTheme === 'dark');
      localStorage.setItem('theme', theme);
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setDisplayName('');
      return;
    }

    const storedName = localStorage.getItem(`displayName:${user.username}`);
    if (storedName) {
      setDisplayName(storedName);
    } else if (user.displayName) {
      setDisplayName(user.displayName);
      localStorage.setItem(`displayName:${user.username}`, user.displayName);
    } else {
      setDisplayName(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [txs, p] = await Promise.all([
            API.getTransactions(user.username),
            PriceService.fetchPrices()
          ]);
          setTransactions(txs);
          setPrices(p);
        } catch (error) {
          console.error("Failed to load data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  const handlePriceUpdate = async () => {
    setIsPriceUpdating(true);
    try {
      const result = await PriceService.fetchLivePrices();
      setPrices(result.data);
      const nextSources = result.sources.length ? result.sources : fallbackSources;
      setSources(nextSources);
      if (result.skipped) {
        const nextTime = result.nextAllowedAt ? new Date(result.nextAllowedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-IR') : '';
        addToast(result.message || (nextTime ? (language === 'en' ? `Update allowed after ${nextTime}` : `بروزرسانی بعد از ${nextTime}`) : (language === 'en' ? 'Update allowed once per hour' : 'بروزرسانی کمتر از یک ساعت مجاز نیست')), 'info');
      } else {
        addToast(language === 'en' ? 'Prices updated successfully' : 'قیمت‌ها با موفقیت بروزرسانی شد', 'success');
      }
    } catch (error) {
      console.error('Price update failed:', error);
      addToast(language === 'en' ? 'Failed to update prices' : 'خطا در بروزرسانی قیمت‌ها', 'error');
    } finally {
      setIsPriceUpdating(false);
    }
  };

  // Global keyboard shortcut for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const availableWallets = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.wallet) set.add(t.wallet);
    });
    return Array.from(set);
  }, [transactions]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.tags) t.tags.forEach(tag => set.add(tag));
    });
    return Array.from(set);
  }, [transactions]);

  const handleImportSuccess = async (importedTransactions: Transaction[], mode: 'replace' | 'merge') => {
    if (!user) return;
    setLoading(true);
    try {
      if (mode === 'replace') {
        for (const t of transactions) {
          await API.deleteTransaction(user.username, t.id);
        }
        for (const t of importedTransactions) {
          await API.saveTransaction(user.username, t);
        }
      } else {
        for (const t of importedTransactions) {
          await API.saveTransaction(user.username, t);
        }
      }
      const updated = await API.getTransactions(user.username);
      setTransactions(updated);
    } catch (error) {
      console.error('Failed to import transactions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const openNewTxWithAsset = (defaultSymbol?: AssetSymbol) => {
    setDefaultAssetForNewTx(defaultSymbol);
    setEditingTransaction(defaultSymbol ? {
      id: '',
      assetSymbol: defaultSymbol,
      quantity: 0,
      buyPricePerUnit: 0,
      buyDateTime: new Date().toISOString(),
      buyCurrency: getAssetDetail(defaultSymbol).type === 'CRYPTO' ? 'USD' : 'TOMAN',
      feesToman: 0,
    } : null);
    setIsTxModalOpen(true);
  };

  const handleDisplayNameChange = (name: string) => {
    setDisplayName(name);
    if (user) {
      localStorage.setItem(`displayName:${user.username}`, name);
    }
  };

  const handleSaveTransaction = async (t: Transaction) => {
    if (!user) return;
    const txToSave = t.id ? t : { ...t, id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) };
    await API.saveTransaction(user.username, txToSave as Transaction);
    const updated = await API.getTransactions(user.username);
    setTransactions(updated);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    await API.deleteTransaction(user.username, id);
    const updated = await API.getTransactions(user.username);
    setTransactions(updated);
  };

  const portfolioSummary: PortfolioSummary = useMemo(() => {
    if (!prices || transactions.length === 0) return {
      totalValueToman: 0,
      totalCostBasisToman: 0,
      totalPnlToman: 0,
      totalPnlPercent: 0,
      totalRealizedPnlToman: 0,
      totalUnrealizedPnlToman: 0,
      assets: []
    };

    const currentPriceMap: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
    };

    Object.entries(prices.fiatPricesToman || {}).forEach(([symbol, tomanPrice]) => {
      currentPriceMap[symbol] = tomanPrice;
    });

    Object.entries(prices.cryptoPricesToman || {}).forEach(([symbol, tomanPrice]) => {
      currentPriceMap[symbol] = tomanPrice;
    });

    Object.entries(prices.goldPricesToman || {}).forEach(([symbol, tomanPrice]) => {
      currentPriceMap[symbol] = tomanPrice;
    });

    const assetsMap: Record<string, AssetSummary> = {};

    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime()
    );

    sortedTxs.forEach(tx => {
      const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman, type = 'BUY' } = tx;
      if (!assetsMap[assetSymbol]) {
        const details = getAssetDetail(assetSymbol);
        assetsMap[assetSymbol] = {
          symbol: assetSymbol,
          name: details.name,
          type: details.type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[assetSymbol] || 0,
          currentValueToman: 0,
          costBasisToman: 0,
          pnlToman: 0,
          pnlPercent: 0,
          realizedPnlToman: 0,
          unrealizedPnlToman: 0,
          allocationPercent: 0,
        };
      }
      const asset = assetsMap[assetSymbol];
      const priceInToman = buyCurrency === 'TOMAN' ? buyPricePerUnit : buyPricePerUnit * (prices.usdToToman || 70000);

      if (type === 'BUY') {
        asset.totalQuantity += quantity;
        const txCostToman = (quantity * priceInToman) + feesToman;
        asset.costBasisToman += txCostToman;
      } else if (type === 'SELL') {
        const avgBuyPrice = asset.totalQuantity > 0 ? (asset.costBasisToman / asset.totalQuantity) : priceInToman;
        const sellProceeds = (quantity * priceInToman) - feesToman;
        const costOfSold = quantity * avgBuyPrice;
        const realizedGain = sellProceeds - costOfSold;

        asset.realizedPnlToman += realizedGain;
        asset.totalQuantity = Math.max(0, asset.totalQuantity - quantity);
        asset.costBasisToman = Math.max(0, asset.costBasisToman - costOfSold);
      }
    });

    let runningTotalValue = 0;
    let runningTotalCost = 0;
    let runningTotalRealized = 0;
    let runningTotalUnrealized = 0;

    const assets = Object.values(assetsMap).map(asset => {
      asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
      asset.unrealizedPnlToman = asset.currentValueToman - asset.costBasisToman;
      asset.pnlToman = asset.unrealizedPnlToman + asset.realizedPnlToman;
      asset.pnlPercent = asset.costBasisToman > 0 ? (asset.unrealizedPnlToman / asset.costBasisToman) * 100 : 0;
      asset.change24h = prices.changes24h?.[asset.symbol] ?? (
        asset.symbol === 'GOLD18' ? prices.changes24h?.['IR_GOLD_18K'] :
        asset.symbol === 'SEKKEH' ? prices.changes24h?.['IR_COIN_EMAMI'] :
        asset.symbol === 'BAHAR' ? prices.changes24h?.['IR_COIN_BAHAR'] :
        asset.symbol === 'NIM' ? prices.changes24h?.['IR_COIN_HALF'] :
        asset.symbol === 'ROB' ? prices.changes24h?.['IR_COIN_QUARTER'] :
        asset.symbol === 'SEK' ? prices.changes24h?.['IR_COIN_1G'] :
        asset.symbol === 'ABSHODEH' ? prices.changes24h?.['IR_GOLD_MELTED'] :
        undefined
      );

      runningTotalValue += asset.currentValueToman;
      runningTotalCost += asset.costBasisToman;
      runningTotalRealized += asset.realizedPnlToman;
      runningTotalUnrealized += asset.unrealizedPnlToman;
      return asset;
    });

    assets.forEach(a => { a.allocationPercent = runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0; });
    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: runningTotalUnrealized + runningTotalRealized,
      totalPnlPercent: runningTotalCost > 0 ? (runningTotalUnrealized / runningTotalCost) * 100 : 0,
      totalRealizedPnlToman: runningTotalRealized,
      totalUnrealizedPnlToman: runningTotalUnrealized,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman)
    };
  }, [transactions, prices]);

  if (!sessionChecked) return null;
  if (!user) return <LoginPage onLoginSuccess={setUser} />;

  const handleLogout = () => {
    AuthService.logout();
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
    setUser(null);
    setIsSettingsDrawerOpen(false);
    setIsAdminPanelOpen(false);
  };

  const filteredAssets = portfolioSummary.assets
    .filter(a => {
      if (holdingCategory !== 'ALL' && a.type !== holdingCategory) return false;
      if (txFilters.searchQuery) {
        return a.name.includes(txFilters.searchQuery) || a.symbol.includes(txFilters.searchQuery.toUpperCase());
      }
      return true;
    });
  const cardSurface = 'bg-[var(--card-bg)] border border-slate-200/80 dark:border-slate-800/80 text-[color:var(--text-primary)]';

  const bestPerformer = portfolioSummary.assets.length > 0 ? portfolioSummary.assets[0] : null;
  const worstPerformer = portfolioSummary.assets.length > 1 ? portfolioSummary.assets[portfolioSummary.assets.length - 1] : null;

  return (
    <Layout
      theme={resolvedTheme}
      navbar={
        <Navbar
          user={user}
          displayName={displayName}
          currentTab={tab}
          onTabChange={setTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          onOpenAdmin={user.isAdmin ? () => setIsAdminPanelOpen(true) : undefined}
          onPriceUpdate={handlePriceUpdate}
          isPriceUpdating={isPriceUpdating}
          onOpenNewTx={() => openNewTxWithAsset()}
          onLogout={handleLogout}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          holdingsCount={portfolioSummary.assets.length}
          transactionsCount={transactions.length}
        />
      }
    >
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }>
        
        {/* ================= TAB 1: OVERVIEW ================= */}
        {tab === 'overview' && (
          <PullToRefresh onRefresh={async () => { await handlePriceUpdate(); }} disabled={isPriceUpdating}>
            <div className="animate-in fade-in duration-500">
              
              {loading ? (
                <SummaryCardSkeleton />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Main Column (8 cols on desktop) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Hero Portfolio Card */}
                    <SummaryCard
                      summary={portfolioSummary}
                      isRefreshing={isPriceUpdating}
                      lastUpdated={prices?.fetchedAt || Date.now()}
                      onRefresh={handlePriceUpdate}
                      prices={prices}
                    />

                    {/* Historical Portfolio Growth Chart */}
                    <PortfolioHistoryChart
                      transactions={transactions}
                      prices={prices}
                      currentTotalValue={portfolioSummary.totalValueToman}
                      currentCostBasis={portfolioSummary.totalCostBasisToman}
                    />

                    {/* Best & Worst Performers Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Best Performer */}
                      <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:border-emerald-500/30`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                            <ArrowUpRight size={16} /> {language === 'en' ? 'Best Performer' : 'بهترین عملکرد سبد'}
                          </span>
                          {bestPerformer && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" dir="ltr">
                              {formatPercent(bestPerformer.pnlPercent, language)}
                            </span>
                          )}
                        </div>
                        {bestPerformer ? (
                          <div>
                            <div className="font-black text-base sm:text-lg text-slate-800 dark:text-white flex items-center justify-between">
                              <span>{getAssetDetail(bestPerformer.symbol, language).name || bestPerformer.name}</span>
                              <span className="text-xs text-slate-400 font-mono">{bestPerformer.symbol}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-1 flex justify-between">
                              <span>{language === 'en' ? 'Net PnL:' : 'سود خالص:'}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400" dir="ltr">+{formatToman(bestPerformer.pnlToman, language)} {language === 'en' ? 'T' : 'ت'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs py-2 font-bold">{language === 'en' ? 'No transactions yet' : 'تراکنشی ثبت نشده است'}</div>
                        )}
                      </div>

                      {/* Worst Performer */}
                      <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:border-rose-500/30`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black text-xs">
                            <ArrowDownRight size={16} /> {language === 'en' ? 'Lowest Return' : 'کمترین بازدهی'}
                          </span>
                          {worstPerformer && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" dir="ltr">
                              {formatPercent(worstPerformer.pnlPercent, language)}
                            </span>
                          )}
                        </div>
                        {worstPerformer ? (
                          <div>
                            <div className="font-black text-base sm:text-lg text-slate-800 dark:text-white flex items-center justify-between">
                              <span>{getAssetDetail(worstPerformer.symbol, language).name || worstPerformer.name}</span>
                              <span className="text-xs text-slate-400 font-mono">{worstPerformer.symbol}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-500 mt-1 flex justify-between">
                              <span>{language === 'en' ? 'PnL:' : 'سود / زیان:'}</span>
                              <span className="font-black text-rose-600 dark:text-rose-400" dir="ltr">{formatToman(worstPerformer.pnlToman, language)} {language === 'en' ? 'T' : 'ت'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs py-2 font-bold">{language === 'en' ? 'Second transaction not recorded' : 'تراکنش دوم ثبت نشده است'}</div>
                        )}
                      </div>

                    </div>

                    {/* Desktop Holdings Table Preview */}
                    <div className={`${cardSurface} rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-sm`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-blue-500" />
                          <h3 className="font-black text-sm sm:text-base text-slate-800 dark:text-white">
                            {language === 'en' ? 'Top Holdings Breakdown' : 'ترکیب دارایی‌های برتر'}
                          </h3>
                        </div>
                        <button
                          onClick={() => { haptic('light'); setTab('holdings'); }}
                          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>{language === 'en' ? 'View All' : 'مشاهده همه'}</span>
                          <ArrowRight size={14} className={language === 'en' ? '' : 'rotate-180'} />
                        </button>
                      </div>

                      {portfolioSummary.assets.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-400 text-xs font-bold">{language === 'en' ? 'No assets added yet' : 'هنوز دارایی‌ای ثبت نکرده‌اید'}</p>
                          <button
                            onClick={() => openNewTxWithAsset()}
                            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                          >
                            {language === 'en' ? '+ Record First Purchase' : '+ ثبت اولین خرید'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {portfolioSummary.assets.slice(0, 5).map((asset) => (
                            <div
                              key={asset.symbol}
                              onClick={() => {
                                haptic('light');
                                setTab('transactions');
                                setTxFilters(f => ({ ...f, searchQuery: asset.symbol }));
                              }}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                                  {asset.symbol.slice(0, 4)}
                                </div>
                                <div>
                                  <div className="font-black text-sm text-slate-800 dark:text-white">
                                    {getAssetDetail(asset.symbol, language).name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                                    {formatNumber(asset.totalQuantity, undefined, language)} {language === 'en' ? 'units' : 'واحد'}
                                  </div>
                                </div>
                              </div>

                              <div className="text-left">
                                <div className="font-black text-sm text-slate-800 dark:text-white" dir="ltr">
                                  {formatToman(asset.currentValueToman, language)} <span className="text-[10px] text-slate-400">{language === 'en' ? 'T' : 'ت'}</span>
                                </div>
                                <div className={`text-[11px] font-bold mt-0.5 ${asset.pnlToman >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">
                                  {asset.pnlToman >= 0 ? '+' : ''}{formatPercent(asset.pnlPercent, language)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Sidebar Column (4 cols on desktop) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Allocation Donut Chart */}
                    <AllocationChart summary={portfolioSummary} />

                    {/* Quick Tools Box */}
                    <div className={`${cardSurface} rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-sm space-y-3`}>
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                        {t('quickTools')}
                      </span>
                      
                      <button
                        onClick={() => { haptic('light'); setIsGoldBubbleOpen(true); }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 transition-all text-right group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/20">
                            <Calculator size={18} />
                          </div>
                          <div>
                            <div className="font-black text-xs sm:text-sm">{t('goldBubbleCalc')}</div>
                            <div className="text-[10px] opacity-80">{t('goldBubbleDesc')}</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => { haptic('light'); setIsDcaModalOpen(true); }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 transition-all text-right group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/20">
                            <Layers size={18} />
                          </div>
                          <div>
                            <div className="font-black text-xs sm:text-sm">{t('dcaCalculator')}</div>
                            <div className="text-[10px] opacity-80">{t('dcaCalcDesc')}</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => { haptic('light'); setIsExportImportOpen(true); }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all text-right group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/20">
                            <Download size={18} />
                          </div>
                          <div>
                            <div className="font-black text-xs sm:text-sm">{t('backupExport')}</div>
                            <div className="text-[10px] opacity-80">{t('backupDesc')}</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => { haptic('light'); setIsCommandPaletteOpen(true); }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-700 dark:text-blue-300 transition-all text-right group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/20">
                            <Search size={18} />
                          </div>
                          <div>
                            <div className="font-black text-xs sm:text-sm">{language === 'en' ? 'Command Palette (⌘K)' : 'پالت دستورات سریع (⌘K)'}</div>
                            <div className="text-[10px] opacity-80">{language === 'en' ? 'Live currency calculator and search' : 'ماشین حساب زنده تبدیل ارز و جستجو'}</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Price Sources Box */}
                    <div className={`${cardSurface} rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-sm`}>
                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                        {t('priceSources')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(sources.length > 0 ? sources : fallbackSources).map((s, i) => (
                          <a
                            key={i}
                            href={s.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-all"
                          >
                            <span>{s.title}</span>
                            <ExternalLink size={11} className="opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </PullToRefresh>
        )}

        {/* ================= TAB 2: HOLDINGS ================= */}
        {tab === 'holdings' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            
            {/* Search & Actions Bar */}
            <div className={`${cardSurface} rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3`}>
              <div className="w-full sm:max-w-md relative">
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={txFilters.searchQuery}
                  onChange={(e) => setTxFilters(f => ({ ...f, searchQuery: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-900/80 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm font-bold focus:outline-none border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => { haptic('light'); setIsGoldBubbleOpen(true); }}
                  className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <Calculator size={16} />
                  <span>{language === 'en' ? 'Gold Bubble' : 'حباب طلا'}</span>
                </button>
                <button
                  onClick={() => { haptic('light'); setIsDcaModalOpen(true); }}
                  className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <Layers size={16} />
                  <span>{language === 'en' ? 'DCA' : 'میانگین‌کم‌کنی'}</span>
                </button>
                <button
                  onClick={() => { haptic('success'); openNewTxWithAsset(); }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>{t('addTransaction')}</span>
                </button>
              </div>
            </div>

            {/* Asset Category Filter Pills */}
            <CategoryPills
              activeCategory={holdingCategory}
              onSelectCategory={setHoldingCategory}
              assets={portfolioSummary.assets}
              totalPortfolioValue={portfolioSummary.totalValueToman}
            />

            {filteredAssets.length === 0 ? (
              <EmptyState
                type="holdings"
                title={language === 'en' ? 'No assets recorded yet' : 'هنوز دارایی‌ای ثبت نشده'}
                description={language === 'en' ? 'Record your first purchase to view assets here.' : 'با افزودن اولین تراکنش، دارایی‌های شما اینجا نمایش داده می‌شود.'}
                actionLabel={t('addTransaction')}
                onAction={() => openNewTxWithAsset()}
              />
            ) : (
              <>
                {/* Desktop Professional Data Table */}
                <div className="hidden md:block overflow-hidden rounded-[28px] sm:rounded-[36px] border border-slate-200/80 dark:border-slate-800/80 bg-[var(--card-bg)] shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="p-4 pr-6">{t('assetSymbol')}</th>
                          <th className="p-4">{t('type')}</th>
                          <th className="p-4 text-left">{t('quantity')}</th>
                          <th className="p-4 text-left">{t('currentPrice')}</th>
                          <th className="p-4 text-left">{t('totalValue')}</th>
                          <th className="p-4 text-left">{t('pnl')}</th>
                          <th className="p-4 text-left">{language === 'en' ? 'Portfolio Share' : 'سهم از سبد'}</th>
                          <th className="p-4 pl-6 text-center">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {filteredAssets.map((asset) => (
                          <tr 
                            key={asset.symbol}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <td className="p-4 pr-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                                  {asset.symbol.slice(0, 4)}
                                </div>
                                <div>
                                  <div className="font-black text-sm text-slate-800 dark:text-white">
                                    {asset.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {asset.symbol}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="p-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {asset.type === 'GOLD' ? (language === 'en' ? 'Gold & Coins' : 'طلا و مسکوکات') : asset.type === 'CRYPTO' ? (language === 'en' ? 'Crypto' : 'ارز دیجیتال') : (language === 'en' ? 'Fiat' : 'ارز فیات')}
                              </span>
                            </td>

                            <td className="p-4 text-left font-black text-slate-800 dark:text-slate-200" dir="ltr">
                              {formatNumber(asset.totalQuantity)}
                            </td>

                            <td className="p-4 text-left font-black text-slate-600 dark:text-slate-300" dir="ltr">
                              {formatToman(asset.currentPriceToman, language)} {language === 'en' ? 'T' : 'ت'}
                            </td>

                            <td className="p-4 text-left font-black text-slate-900 dark:text-white text-sm" dir="ltr">
                              {formatToman(asset.currentValueToman, language)} {language === 'en' ? 'T' : 'ت'}
                            </td>

                            <td className="p-4 text-left font-black" dir="ltr">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                                asset.pnlToman >= 0 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {asset.pnlToman >= 0 ? '+' : ''}{formatPercent(asset.pnlPercent, language)}
                              </span>
                            </td>

                            <td className="p-4 text-left font-black text-slate-700 dark:text-slate-300" dir="ltr">
                              {Math.round(asset.allocationPercent)}%
                            </td>

                            <td className="p-4 pl-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openNewTxWithAsset(asset.symbol as AssetSymbol)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[11px] font-bold"
                                  title={language === 'en' ? 'Buy more' : 'خرید مجدد این دارایی'}
                                >
                                  + {t('buy')}
                                </button>
                                <button
                                  onClick={() => {
                                    haptic('light');
                                    setTab('transactions');
                                    setTxFilters(f => ({ ...f, searchQuery: asset.symbol }));
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 text-[11px] font-bold"
                                  title={language === 'en' ? 'View transactions' : 'مشاهده تراکنش‌ها'}
                                >
                                  {language === 'en' ? 'History' : 'تاریخچه'}
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredAssets.map(asset => (
                    <AssetRow 
                      key={asset.symbol} 
                      asset={asset} 
                      onClick={() => { 
                        haptic('light'); 
                        setTab('transactions'); 
                        setTxFilters(f => ({ ...f, searchQuery: asset.symbol })); 
                      }} 
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 3: TRANSACTIONS ================= */}
        {tab === 'transactions' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            
            {/* Header with Title & Quick Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                    {t('txHistory')}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {language === 'en' ? `${transactions.length} transactions recorded` : `${formatNumber(transactions.length, 0, language)} تراکنش ثبت شده در پورتفوی`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { haptic('light'); setIsExportImportOpen(true); }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1.5 shadow-sm"
                  title={language === 'en' ? 'Excel Export / Backup' : 'خروجی و ورودی اکسل / بکاپ'}
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">{language === 'en' ? 'Excel Export' : 'خروجی اکسل'}</span>
                </button>

                <button
                  onClick={() => { haptic('success'); openNewTxWithAsset(); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 transition-all"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>{t('recordNewTx')}</span>
                </button>
              </div>
            </div>

            {/* Transaction Filter Toolbar */}
            <div className={`${cardSurface} rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 shadow-sm`}>
              <TransactionFilter
                filters={txFilters}
                onFiltersChange={setTxFilters}
                availableWallets={availableWallets}
                availableTags={availableTags}
              />
            </div>

            {transactions.length === 0 ? (
              <EmptyState
                type="transactions"
                title={language === 'en' ? 'No transactions recorded' : 'تراکنشی ثبت نشده'}
                description={language === 'en' ? 'Record your first purchase to view transaction history here.' : 'با ثبت اولین خرید خود، تاریخچه تراکنش‌ها را اینجا مشاهده کنید.'}
                actionLabel={t('recordNewTx')}
                onAction={() => openNewTxWithAsset()}
              />
            ) : (() => {
              const filteredTxs = filterTransactions(
                [...transactions].reverse(),
                txFilters,
                (symbol) => getAssetDetail(symbol).type
              );

              return filteredTxs.length === 0 ? (
                <div className={`${cardSurface} text-center py-16 rounded-[32px]`}>
                  <p className="text-slate-400 font-bold text-sm">{language === 'en' ? 'No transactions found matching your criteria' : 'تراکنشی با این مشخصات یافت نشد'}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Data Table */}
                  <div className="hidden md:block overflow-hidden rounded-[28px] sm:rounded-[36px] border border-slate-200/80 dark:border-slate-800/80 bg-[var(--card-bg)] shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="p-4 pr-6">{t('date')}</th>
                            <th className="p-4">{t('assetSymbol')}</th>
                            <th className="p-4 text-left">{t('quantity')}</th>
                            <th className="p-4 text-left">{t('unitPrice')}</th>
                            <th className="p-4 text-left">{language === 'en' ? 'Total Cost' : 'هزینه کل'}</th>
                            <th className="p-4">{t('wallet')}</th>
                            <th className="p-4">{t('tags')}</th>
                            <th className="p-4">{t('note')}</th>
                            <th className="p-4 pl-6 text-center">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {filteredTxs.map((tx) => {
                            const detail = getAssetDetail(tx.assetSymbol, language);
                            const totalCost = tx.buyCurrency === 'TOMAN' 
                              ? (tx.quantity * tx.buyPricePerUnit) + (tx.feesToman || 0)
                              : (tx.quantity * tx.buyPricePerUnit * (prices?.usdToToman || 0)) + (tx.feesToman || 0);

                            return (
                              <tr 
                                key={tx.id}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                              >
                                <td className="p-4 pr-6 text-slate-600 dark:text-slate-300 font-bold" dir="ltr">
                                  {new Date(tx.buyDateTime).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                                </td>

                                <td className="p-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px]">
                                      {tx.assetSymbol.slice(0, 3)}
                                    </div>
                                    <div>
                                      <div className="font-black text-slate-800 dark:text-white">
                                        {detail.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {tx.assetSymbol}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 text-left font-black text-slate-800 dark:text-slate-100" dir="ltr">
                                  {formatNumber(tx.quantity)}
                                </td>

                                <td className="p-4 text-left font-bold text-slate-600 dark:text-slate-300" dir="ltr">
                                  {formatNumber(tx.buyPricePerUnit, undefined, language)} {tx.buyCurrency === 'USD' ? '$' : (language === 'en' ? 'T' : 'ت')}
                                </td>

                                <td className="p-4 text-left font-black text-slate-900 dark:text-white" dir="ltr">
                                  {formatToman(totalCost, language)} {language === 'en' ? 'T' : 'ت'}
                                </td>

                                <td className="p-4">
                                  {tx.wallet ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      {tx.wallet}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">-</span>
                                  )}
                                </td>

                                <td className="p-4">
                                  {tx.tags && tx.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {tx.tags.map(tag => (
                                        <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">-</span>
                                  )}
                                </td>

                                <td className="p-4 text-slate-400 text-[11px] truncate max-w-[120px]">
                                  {tx.note || '-'}
                                </td>

                                <td className="p-4 pl-6 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        haptic('light');
                                        setEditingTransaction(tx);
                                        setIsTxModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                      title={t('edit')}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        haptic('error');
                                        if (window.confirm(language === 'en' ? 'Are you sure you want to delete this transaction?' : 'آیا از حذف این تراکنش اطمینان دارید؟')) {
                                          handleDeleteTransaction(tx.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                                      title={t('delete')}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden space-y-3">
                    {filteredTxs.map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => { haptic('light'); setEditingTransaction(tx); setIsTxModalOpen(true); }}
                        className={`${cardSurface} p-4 rounded-3xl flex flex-col gap-2 cursor-pointer hover:border-blue-500/40 transition-all shadow-sm`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                              {tx.assetSymbol}
                            </div>
                            <div>
                              <div className="font-black text-sm text-[color:var(--text-primary)]">
                                {getAssetDetail(tx.assetSymbol, language).name}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5" dir="ltr">
                                {new Date(tx.buyDateTime).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                              </div>
                            </div>
                          </div>
                          <div className="text-left font-black text-sm text-[color:var(--text-primary)]" dir="ltr">
                            {formatNumber(tx.quantity)}
                          </div>
                        </div>

                        {(tx.wallet || (tx.tags && tx.tags.length > 0)) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[color:var(--border-color)]">
                            {tx.wallet && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                📍 {tx.wallet}
                              </span>
                            )}
                            {tx.tags?.map(t => (
                              <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

          </div>
        )}

        {/* ================= TAB 4: MARKET BOARD ================= */}
        {tab === 'market' && (
          <MarketBoard
            prices={prices}
            onRefreshPrices={handlePriceUpdate}
            isPriceUpdating={isPriceUpdating}
            onOpenNewTxWithAsset={openNewTxWithAsset}
            onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
          />
        )}

        {/* Floating Mobile Bottom Nav */}
        <BottomNav currentTab={tab} onTabChange={setTab} />

        {/* Lazy Modals & Drawers */}
        <TransactionModal
          isOpen={isTxModalOpen}
          initialData={editingTransaction}
          onClose={() => { setIsTxModalOpen(false); setDefaultAssetForNewTx(undefined); }}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />

        <GoldBubbleModal
          isOpen={isGoldBubbleOpen}
          onClose={() => setIsGoldBubbleOpen(false)}
          prices={prices}
          onRefreshPrices={handlePriceUpdate}
        />

        <ExportImportModal
          isOpen={isExportImportOpen}
          onClose={() => setIsExportImportOpen(false)}
          transactions={transactions}
          username={user.username}
          prices={prices}
          onImportSuccess={handleImportSuccess}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          prices={prices}
          onOpenNewTransaction={(sym) => openNewTxWithAsset(sym)}
          onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onRefreshPrices={handlePriceUpdate}
          onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          isAdmin={user.isAdmin}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        />

        <SettingsDrawer
          isOpen={isSettingsDrawerOpen}
          onClose={() => setIsSettingsDrawerOpen(false)}
          displayName={displayName || user.username}
          username={user.username}
          onDisplayNameChange={handleDisplayNameChange}
          theme={theme}
          onThemeChange={setTheme}
          onLogout={handleLogout}
          onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
          onOpenDcaCalculator={() => setIsDcaModalOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onOpenAdmin={user.isAdmin ? () => setIsAdminPanelOpen(true) : undefined}
          isAdmin={user.isAdmin}
          onPriceUpdate={handlePriceUpdate}
          isPriceUpdating={isPriceUpdating}
        />

        <DcaCalculatorModal
          isOpen={isDcaModalOpen}
          onClose={() => setIsDcaModalOpen(false)}
          portfolioAssets={portfolioSummary.assets}
          prices={prices}
        />

        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      </Suspense>
    </Layout>
  );
}
