import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { AllocationChart } from './components/AllocationChart';
import { AssetRow } from './components/AssetRow';
import { SummaryCardSkeleton, AssetRowSkeleton } from './components/Skeleton';
import { EmptyState } from './components/EmptyState';
import { PullToRefresh } from './components/PullToRefresh';
import { LoginPage } from './components/LoginPage';
import { Transaction, PriceData, PortfolioSummary, AssetSummary, getAssetDetail } from './types';
import { API } from './services/api';
import * as PriceService from './services/priceService';
import { Plus, ArrowUpRight, ArrowDownRight, LogOut, Shield, Settings, Sparkles, UserCircle, RefreshCw, Calculator, Download, Search } from 'lucide-react';
import { formatToman, formatNumber, formatPercent } from './utils/formatting';
import * as AuthService from './services/authService';
import { useToast } from './components/Toast';
import { TransactionFilter, TransactionFilters, filterTransactions } from './components/TransactionFilter';
import { useHaptics } from './hooks/useHaptics';

// Lazy Load Heavy Components
const TransactionModal = lazy(() => import('./components/TransactionModal').then(module => ({ default: module.TransactionModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const SettingsDrawer = lazy(() => import('./components/SettingsDrawer').then(module => ({ default: module.SettingsDrawer })));
const GoldBubbleModal = lazy(() => import('./components/GoldBubbleModal').then(module => ({ default: module.GoldBubbleModal })));
const ExportImportModal = lazy(() => import('./components/ExportImportModal').then(module => ({ default: module.ExportImportModal })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(module => ({ default: module.CommandPalette })));

export default function App() {
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
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [defaultAssetForNewTx, setDefaultAssetForNewTx] = useState<AssetSymbol | undefined>(undefined);
  const [txFilters, setTxFilters] = useState<TransactionFilters>({
    assetType: 'ALL',
    dateRange: 'all',
    searchQuery: '',
  });
  const { haptic } = useHaptics();
  const { addToast } = useToast();
  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme') as ThemeOption | null;
    return stored || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const fallbackSources = [
    { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
    { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
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
        const nextTime = result.nextAllowedAt ? new Date(result.nextAllowedAt).toLocaleTimeString('fa-IR') : '';
        addToast(result.message || (nextTime ? `بروزرسانی بعد از ${nextTime}` : 'بروزرسانی کمتر از یک ساعت مجاز نیست'), 'info');
      } else {
        addToast('قیمت‌ها با موفقیت بروزرسانی شد', 'success');
      }
    } catch (error) {
      console.error('Price update failed:', error);
      addToast('خطا در بروزرسانی قیمت‌ها', 'error');
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
        // Delete existing transactions and save new ones
        for (const t of transactions) {
          await API.deleteTransaction(user.username, t.id);
        }
        for (const t of importedTransactions) {
          await API.saveTransaction(user.username, t);
        }
      } else {
        // Merge mode: Add new ones
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
    const txToSave = t.id ? t : { ...t, id: Math.random().toString(36).substr(2, 9) };
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
      totalValueToman: 0, totalCostBasisToman: 0, totalPnlToman: 0, totalPnlPercent: 0, assets: []
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

    transactions.forEach(tx => {
      const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman } = tx;
      if (!assetsMap[assetSymbol]) {
        const details = getAssetDetail(assetSymbol);
        assetsMap[assetSymbol] = {
          symbol: assetSymbol,
          name: details.name,
          type: details.type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[assetSymbol] || 0,
          currentValueToman: 0, costBasisToman: 0, pnlToman: 0, pnlPercent: 0, allocationPercent: 0,
        };
      }
      const asset = assetsMap[assetSymbol];
      asset.totalQuantity += quantity;
      let txCostToman = buyCurrency === 'TOMAN' ? (quantity * buyPricePerUnit) + feesToman : (quantity * buyPricePerUnit * prices.usdToToman) + feesToman;
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

    assets.forEach(a => { a.allocationPercent = runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0; });
    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: runningTotalValue - runningTotalCost,
      totalPnlPercent: runningTotalCost > 0 ? ((runningTotalValue - runningTotalCost) / runningTotalCost) * 100 : 0,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman)
    };
  }, [transactions, prices]);

  type ThemeOption = 'light' | 'dark' | 'system';

  if (!sessionChecked) return null;
  if (!user) return <LoginPage onLoginSuccess={setUser} />;

  const handleLogout = () => {
    AuthService.logout();
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
    setUser(null);
    setIsSettingsDrawerOpen(false);
    setIsAdminPanelOpen(false);
  };

  const filteredAssets = portfolioSummary.assets.filter(a => a.name.includes(txFilters.searchQuery) || a.symbol.includes(txFilters.searchQuery.toUpperCase()));
  const cardSurface = 'bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)]';
  const mutedText = 'text-[color:var(--text-muted)]';
  const pillTone = 'bg-[color:var(--pill-bg)] text-[color:var(--text-muted)]';
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];
  const sourceContainerTone = resolvedTheme === 'dark'
    ? 'bg-gradient-to-r from-blue-950/50 via-blue-900/40 to-indigo-900/20 border-blue-900 text-blue-100'
    : 'bg-blue-50/60 border-blue-100 text-blue-600';
  const sourceBadgeTone = resolvedTheme === 'dark'
    ? 'bg-blue-900/60 border-blue-800 text-blue-100 hover:bg-blue-800'
    : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-100';

  return (
    <Layout theme={resolvedTheme}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        {tab === 'overview' && (
          <PullToRefresh onRefresh={async () => { await handlePriceUpdate(); }} disabled={isPriceUpdating}>
            <div className="p-4 space-y-4 animate-in fade-in duration-500 pb-20">
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <span className="font-black text-[color:var(--text-primary)] text-lg tracking-tight block leading-none">{displayName || 'پنل مدیریت'}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-blue-600 font-bold uppercase">{user.username}</span>
                      <span className="text-[8px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded hidden sm:flex items-center gap-0.5 border border-violet-200 dark:border-violet-500/20">
                        <Sparkles size={8} /> Powered by AI
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Spotlight / Command Palette Button */}
                  <button
                    onClick={() => { haptic('light'); setIsCommandPaletteOpen(true); }}
                    className={`${cardSurface} p-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-1`}
                    title="پالت دستورات سریع (Cmd+K)"
                  >
                    <Search size={16} className="text-blue-500" />
                    <kbd className="hidden md:inline-block text-[9px] font-mono px-1 rounded bg-[color:var(--pill-bg)] text-[color:var(--text-muted)]">⌘K</kbd>
                  </button>

                  {/* Gold Bubble Button */}
                  <button
                    onClick={() => { haptic('light'); setIsGoldBubbleOpen(true); }}
                    className={`${cardSurface} p-2.5 rounded-xl text-amber-500 hover:opacity-90 transition-all`}
                    title="محاسبه‌گر حباب طلا و سکه"
                  >
                    <Calculator size={18} />
                  </button>

                  {/* Export / Import Button */}
                  <button
                    onClick={() => { haptic('light'); setIsExportImportOpen(true); }}
                    className={`${cardSurface} p-2.5 rounded-xl text-emerald-500 hover:opacity-90 transition-all`}
                    title="خروجی و ورودی اکسل / بکاپ"
                  >
                    <Download size={18} />
                  </button>

                  <button
                    onClick={() => { haptic('light'); setIsSettingsDrawerOpen(true); }}
                    className={`${cardSurface} p-2.5 rounded-xl hover:opacity-90 transition-all`}
                    aria-label="تنظیمات حساب"
                  >
                    <UserCircle size={18} />
                  </button>

                  {user.isAdmin && (
                    <button onClick={() => setIsAdminPanelOpen(true)} className={`${cardSurface} p-2.5 rounded-xl text-amber-500 hover:opacity-90 transition-all`} title="پنل مدیریت">
                      <Shield size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => { haptic('medium'); handlePriceUpdate(); }}
                    disabled={isPriceUpdating}
                    className={`relative overflow-hidden group flex items-center gap-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white text-[10px] font-black px-3.5 py-2.5 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-95 transition-all ${isPriceUpdating ? 'animate-pulse opacity-80' : ''}`}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <Sparkles size={14} className={isPriceUpdating ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">بروزرسانی</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <SummaryCardSkeleton />
              ) : (
                <>
                  <SummaryCard
                    summary={portfolioSummary}
                    isRefreshing={isPriceUpdating}
                    lastUpdated={prices?.fetchedAt || Date.now()}
                    onRefresh={handlePriceUpdate}
                    prices={prices}
                  />
                  <AllocationChart summary={portfolioSummary} />
                </>
              )}

              {sources.length > 0 && (
                <div className={`p-4 rounded-3xl border flex flex-col gap-3 mx-1 ${sourceContainerTone}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">منابع معتبر قیمت گذاری:</span>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-2 rounded-xl border text-[9px] font-bold transition-colors shadow-sm ${sourceBadgeTone}`}
                      >
                        {s.title.slice(0, 30)}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider mb-1">
                      <ArrowUpRight size={14} />
                      <span>بهترین عملکرد</span>
                    </div>
                    {portfolioSummary.assets[0] ? (
                      <div className="mt-2">
                        <div className="font-black text-[color:var(--text-primary)] text-sm truncate">{portfolioSummary.assets[0].name}</div>
                        <div className="text-emerald-500 text-xs font-black mt-1" dir="ltr">{formatPercent(portfolioSummary.assets[0].pnlPercent)}</div>
                      </div>
                    ) : <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>}
                  </div>
                </div>
                <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider mb-1">
                      <ArrowDownRight size={14} />
                      <span>ضعیف‌ترین عملکرد</span>
                    </div>
                    {portfolioSummary.assets.length > 1 ? (
                      <div className="mt-2">
                        <div className="font-black text-[color:var(--text-primary)] text-sm truncate">{portfolioSummary.assets[portfolioSummary.assets.length - 1].name}</div>
                        <div className="text-rose-500 text-xs font-black mt-1" dir="ltr">{formatPercent(portfolioSummary.assets[portfolioSummary.assets.length - 1].pnlPercent)}</div>
                      </div>
                    ) : <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>}
                  </div>
                </div>
              </div>
            </div>
          </PullToRefresh>
        )}

        {tab === 'holdings' && (
          <div className="animate-in fade-in duration-300 pb-20">
            <div className="sticky top-0 bg-[color:var(--card-bg)]/80 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-[color:var(--border-color)] flex gap-2">
              <input
                type="text"
                placeholder="جستجو در دارایی‌ها..."
                value={txFilters.searchQuery}
                onChange={(e) => setTxFilters(f => ({ ...f, searchQuery: e.target.value }))}
                className="flex-1 bg-[color:var(--muted-surface)] rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]"
              />
              <button
                onClick={() => { haptic('light'); setIsGoldBubbleOpen(true); }}
                className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl"
                title="حباب طلا و سکه"
              >
                <Calculator size={18} />
              </button>
            </div>
            {filteredAssets.length === 0 ? (
              <EmptyState
                type="holdings"
                title="هنوز دارایی‌ای ثبت نشده"
                description="با افزودن اولین تراکنش، دارایی‌های شما اینجا نمایش داده می‌شود."
                actionLabel="افزودن تراکنش"
                onAction={() => openNewTxWithAsset()}
              />
            ) : (
              <div>
                {filteredAssets.map(asset => (
                  <AssetRow key={asset.symbol} asset={asset} onClick={() => { haptic('light'); setTab('transactions'); setTxFilters(f => ({ ...f, searchQuery: asset.symbol })); }} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'transactions' && (
          <div className="p-4 pb-24 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-[color:var(--text-primary)]">تاریخچه</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { haptic('light'); setIsExportImportOpen(true); }}
                  className="p-2.5 rounded-xl border border-[color:var(--border-color)] bg-[color:var(--muted-surface)] text-emerald-600 dark:text-emerald-400"
                  title="خروجی و ورودی اکسل"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => { haptic('medium'); setIsSettingsDrawerOpen(true); }}
                  className="p-2.5 rounded-xl border border-[color:var(--border-color)] bg-[color:var(--muted-surface)] text-[color:var(--text-muted)]"
                  aria-label="تنظیمات"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => { haptic('success'); openNewTxWithAsset(); }}
                  className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-white/10 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition-all"
                  aria-label="افزودن تراکنش جدید"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <button onClick={() => { haptic('error'); handleLogout(); }} className="p-2.5 bg-rose-50 rounded-xl text-rose-500"><LogOut size={18} /></button>
              </div>
            </div>

            {/* Transaction Filters with Wallets & Tags */}
            <div className="mb-4">
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
                title="تراکنشی ثبت نشده"
                description="با ثبت اولین خرید خود، تاریخچه تراکنش‌ها را اینجا مشاهده کنید."
                actionLabel="ثبت تراکنش جدید"
                onAction={() => openNewTxWithAsset()}
              />
            ) : (() => {
              const filteredTxs = filterTransactions(
                [...transactions].reverse(),
                txFilters,
                (symbol) => getAssetDetail(symbol).type
              );
              return filteredTxs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[color:var(--text-muted)] font-bold">تراکنشی با این فیلترها یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
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
                              {getAssetDetail(tx.assetSymbol).name}
                            </div>
                            <div className={`text-[10px] font-bold mt-0.5 ${mutedText}`} dir="ltr">
                              {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-left font-black text-sm text-[color:var(--text-primary)]" dir="ltr">
                          {formatNumber(tx.quantity)}
                        </div>
                      </div>

                      {/* Wallet and Tags Pills */}
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
              );
            })()}
          </div>
        )}

        <BottomNav currentTab={tab} onTabChange={setTab} />

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
        />
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      </Suspense>
    </Layout>
  );
}
