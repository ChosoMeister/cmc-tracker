import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  Suspense,
  lazy,
} from 'react';
import { Layout } from './components/Layout';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { AllocationChart } from './components/AllocationChart';
import { AssetRow } from './components/AssetRow';
import { SummaryCardSkeleton } from './components/Skeleton';
import { EmptyState } from './components/EmptyState';
import { PullToRefresh } from './components/PullToRefresh';
import { ConfirmDialog } from './components/ConfirmDialog';
import {
  Transaction,
  PriceData,
  PortfolioSummary,
  AssetSummary,
  AssetSymbol,
  TransactionType,
  getAssetDetail,
  isCoinAsset,
  resolveAssetSymbol,
} from './types';
import { API } from './services/api';
import * as PriceService from './services/priceService';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Download,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  History,
  Layers,
  ArrowRight,
  Wallet,
  X,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  formatPercent,
  formatDateCached,
  getAssetIconUrl,
  getAssetFallbackIcon,
} from './utils/formatting';
import * as AuthService from './services/authService';
import { useToast } from './components/Toast';
import {
  TransactionFilter,
  TransactionFilters,
  filterTransactions,
} from './components/TransactionFilter';
import { useHaptics } from './hooks/useHaptics';
import { useTranslation } from './contexts/LanguageContext';
import { CategoryPills, CategoryFilterType } from './components/CategoryPills';

// Lazy Load Secondary Views, Modals & Drawers
const LoginPage = lazy(() =>
  import('./components/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const MarketBoard = lazy(() =>
  import('./components/MarketBoard').then((m) => ({ default: m.MarketBoard }))
);
const PortfolioHistoryChart = lazy(() =>
  import('./components/PortfolioHistoryChart').then((m) => ({ default: m.PortfolioHistoryChart }))
);
const TransactionModal = lazy(() =>
  import('./components/TransactionModal').then((m) => ({ default: m.TransactionModal }))
);
const AssetDetailDrawer = lazy(() =>
  import('./components/AssetDetailDrawer').then((m) => ({ default: m.AssetDetailDrawer }))
);
const SettingsDrawer = lazy(() =>
  import('./components/SettingsDrawer').then((m) => ({ default: m.SettingsDrawer }))
);
const GoldBubbleModal = lazy(() =>
  import('./components/GoldBubbleModal').then((m) => ({ default: m.GoldBubbleModal }))
);
const ExportImportModal = lazy(() =>
  import('./components/ExportImportModal').then((m) => ({ default: m.ExportImportModal }))
);
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const DcaCalculatorModal = lazy(() =>
  import('./components/DcaCalculatorModal').then((m) => ({ default: m.DcaCalculatorModal }))
);
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

type SessionUser = { username: string; isAdmin: boolean; displayName?: string };

function readInitialSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AuthService.SESSION_USER_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed?.username && typeof parsed.isAdmin === 'boolean') {
      return parsed;
    }
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
  } catch {
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
  }
  return null;
}

const VALID_TABS = new Set(['overview', 'holdings', 'market', 'transactions']);

function readTabFromHash(): string {
  if (typeof window === 'undefined') return 'overview';
  const raw = window.location.hash.replace(/^#/, '').trim();
  return VALID_TABS.has(raw) ? raw : 'overview';
}

export default function App() {
  const { t, language } = useTranslation();
  const { haptic } = useHaptics();
  const { addToast } = useToast();

  // Synchronous initial session & theme (eliminates blank frame & flash)
  const [user, setUser] = useState<SessionUser | null>(readInitialSessionUser);
  const [tab, setTabState] = useState<string>(readTabFromHash);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

  // Modal & Drawer states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultAssetForNewTx, setDefaultAssetForNewTx] = useState<AssetSymbol | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('BUY');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<AssetSymbol | null>(null);
  const [pendingDeleteTxId, setPendingDeleteTxId] = useState<string | null>(null);

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isGoldBubbleOpen, setIsGoldBubbleOpen] = useState(false);
  const [isDcaModalOpen, setIsDcaModalOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Decoupled Holdings vs Transactions filters
  const [holdingCategory, setHoldingCategory] = useState<CategoryFilterType>('ALL');
  const [holdingsSearch, setHoldingsSearch] = useState('');
  const deferredHoldingsSearch = useDeferredValue(holdingsSearch);

  const [txFilters, setTxFilters] = useState<TransactionFilters>({
    assetType: 'ALL',
    dateRange: 'all',
    searchQuery: '',
  });

  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    return stored || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });

  const fallbackSources = useMemo(
    () => [
      {
        title: language === 'en' ? 'BrsApi Market Feed' : 'وب‌سرویس نرخ بازار BrsApi',
        uri: 'https://brsapi.ir',
      },
      {
        title: language === 'en' ? 'TGJU Gold & Currency Network' : 'شبکه اطلاع‌رسانی طلا و ارز',
        uri: 'https://tgju.org',
      },
      {
        title: language === 'en' ? 'Binance Spot Quotes' : 'نرخ جهانی رمزارز بایننس',
        uri: 'https://www.binance.com',
      },
    ],
    [language]
  );

  // Sync theme with both <html> and <body>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const nextTheme = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.body.classList.toggle('dark', nextTheme === 'dark');
      localStorage.setItem('theme', theme);
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // Tab navigation with scroll reset + URL hash history
  const navigateTab = useCallback((nextTab: string) => {
    if (!VALID_TABS.has(nextTab)) return;
    setTabState((prev) => {
      if (prev !== nextTab && typeof window !== 'undefined') {
        const nextHash = `#${nextTab}`;
        if (window.location.hash !== nextHash) {
          window.history.pushState({ zarfolioTab: nextTab }, '', nextHash);
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      return nextTab;
    });
  }, []);

  // Browser / Android Hardware Back Button handler:
  // Closes open overlays/drawers first before switching tabs or leaving the app.
  const anyOverlayOpen =
    Boolean(pendingDeleteTxId) ||
    isCommandPaletteOpen ||
    isTxModalOpen ||
    Boolean(selectedAssetSymbol) ||
    isGoldBubbleOpen ||
    isDcaModalOpen ||
    isExportImportOpen ||
    isSettingsDrawerOpen ||
    isAdminPanelOpen;

  useEffect(() => {
    if (!anyOverlayOpen || typeof window === 'undefined') return;
    if (!window.history.state?.zarfolioOverlay) {
      window.history.pushState(
        { ...window.history.state, zarfolioOverlay: true },
        '',
        window.location.href
      );
    }
  }, [anyOverlayOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (pendingDeleteTxId) {
        setPendingDeleteTxId(null);
        return;
      }
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }
      if (isTxModalOpen) {
        setIsTxModalOpen(false);
        setEditingTransaction(null);
        setDefaultAssetForNewTx(null);
        return;
      }
      if (selectedAssetSymbol) {
        setSelectedAssetSymbol(null);
        return;
      }
      if (isGoldBubbleOpen) {
        setIsGoldBubbleOpen(false);
        return;
      }
      if (isDcaModalOpen) {
        setIsDcaModalOpen(false);
        return;
      }
      if (isExportImportOpen) {
        setIsExportImportOpen(false);
        return;
      }
      if (isSettingsDrawerOpen) {
        setIsSettingsDrawerOpen(false);
        return;
      }
      if (isAdminPanelOpen) {
        setIsAdminPanelOpen(false);
        return;
      }

      const hashTab = readTabFromHash();
      setTabState(hashTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    pendingDeleteTxId,
    isCommandPaletteOpen,
    isTxModalOpen,
    selectedAssetSymbol,
    isGoldBubbleOpen,
    isDcaModalOpen,
    isExportImportOpen,
    isSettingsDrawerOpen,
    isAdminPanelOpen,
  ]);

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
    if (!user) return;
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [txs, p] = await Promise.all([
          API.getTransactions(user.username),
          PriceService.fetchPrices(),
        ]);
        if (!active) return;
        setTransactions(txs);
        setPrices(p);
      } catch (error) {
        console.error('Failed to load portfolio data', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const handlePriceUpdate = useCallback(async () => {
    setIsPriceUpdating(true);
    try {
      const result = await PriceService.fetchLivePrices();
      setPrices(result.data);
      const nextSources = result.sources.length ? result.sources : fallbackSources;
      setSources(nextSources);
      if (result.skipped) {
        const nextTime = result.nextAllowedAt
          ? new Date(result.nextAllowedAt).toLocaleTimeString(
              language === 'en' ? 'en-US' : 'fa-IR'
            )
          : '';
        addToast(
          result.message ||
            (nextTime
              ? language === 'en'
                ? `Update allowed after ${nextTime}`
                : `بروزرسانی بعد از ${nextTime}`
              : language === 'en'
                ? 'Using recent cached market rates'
                : 'نرخ‌های کش‌شده اخیر معتبر هستند'),
          'info'
        );
      } else {
        addToast(
          language === 'en' ? 'Market rates updated' : 'نرخ‌های بازار با موفقیت بروزرسانی شد',
          'success'
        );
      }
    } catch (error) {
      console.error('Price update failed:', error);
      addToast(
        language === 'en' ? 'Failed to update prices' : 'خطا در بروزرسانی قیمت‌ها',
        'error'
      );
    } finally {
      setIsPriceUpdating(false);
    }
  }, [fallbackSources, language, addToast]);

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
    transactions.forEach((tx) => {
      if (tx.wallet) set.add(tx.wallet);
    });
    return Array.from(set);
  }, [transactions]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.tags) tx.tags.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [transactions]);

  // Fast Single-Request Bulk Import (eliminates 200 sequential HTTP waterfall)
  const handleImportSuccess = useCallback(
    async (importedTransactions: Transaction[], mode: 'replace' | 'merge') => {
      if (!user) return;
      setLoading(true);
      try {
        await API.saveTransactionsBulk(user.username, importedTransactions, mode);
        const updated = await API.getTransactions(user.username);
        setTransactions(updated);
      } catch (error) {
        console.error('Failed to import transactions:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Cleanly open TransactionModal for a brand-new trade (NEVER sets fake empty editingTransaction!)
  const openNewTxWithAsset = useCallback(
    (defaultSymbol?: AssetSymbol, txType: TransactionType = 'BUY') => {
      setEditingTransaction(null);
      setDefaultAssetForNewTx(defaultSymbol || null);
      setDefaultTxType(txType);
      setIsTxModalOpen(true);
    },
    []
  );

  const handleDisplayNameChange = useCallback(
    (name: string) => {
      setDisplayName(name);
      if (user) {
        localStorage.setItem(`displayName:${user.username}`, name);
      }
    },
    [user]
  );

  const handleSaveTransaction = useCallback(
    async (tx: Transaction) => {
      if (!user) return;
      const isUpdate = Boolean(tx.id);
      const txToSave: Transaction = tx.id
        ? tx
        : {
            ...tx,
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          };
      await API.saveTransaction(user.username, txToSave);
      const updated = await API.getTransactions(user.username);
      setTransactions(updated);
      addToast(
        isUpdate
          ? language === 'en'
            ? 'Transaction updated'
            : 'تراکنش ویرایش شد'
          : language === 'en'
            ? 'Transaction recorded'
            : 'تراکنش جدید ثبت شد',
        'success'
      );
    },
    [user, addToast, language]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      await API.deleteTransaction(user.username, id);
      const updated = await API.getTransactions(user.username);
      setTransactions(updated);
      addToast(language === 'en' ? 'Transaction deleted' : 'تراکنش حذف شد', 'info');
    },
    [user, addToast, language]
  );

  const portfolioSummary: PortfolioSummary = useMemo(() => {
    if (!prices || transactions.length === 0) {
      return {
        totalValueToman: 0,
        totalCostBasisToman: 0,
        totalPnlToman: 0,
        totalPnlPercent: 0,
        totalRealizedPnlToman: 0,
        totalUnrealizedPnlToman: 0,
        assets: [],
      };
    }

    const currentPriceMap: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
      ...prices.fiatPricesToman,
      ...prices.cryptoPricesToman,
      ...prices.goldPricesToman,
    };
    if (!currentPriceMap.GRAM_COIN) {
      currentPriceMap.GRAM_COIN =
        prices.goldPricesToman?.GERAMI || prices.goldPricesToman?.GRAM_COIN || 0;
    }

    const assetsMap: Record<string, AssetSummary> = {};

    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime()
    );

    sortedTxs.forEach((tx) => {
      const symbol = resolveAssetSymbol(tx);
      const { quantity, buyPricePerUnit, buyCurrency, feesToman, type = 'BUY' } = tx;

      if (!assetsMap[symbol]) {
        const details = getAssetDetail(symbol, language);
        assetsMap[symbol] = {
          symbol,
          name: details.name,
          type: details.type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[symbol] || 0,
          currentValueToman: 0,
          costBasisToman: 0,
          pnlToman: 0,
          pnlPercent: 0,
          realizedPnlToman: 0,
          unrealizedPnlToman: 0,
          allocationPercent: 0,
        };
      }
      const asset = assetsMap[symbol];
      const priceInToman =
        buyCurrency === 'TOMAN'
          ? buyPricePerUnit
          : buyPricePerUnit * (prices.usdToToman || 70000);

      if (type === 'BUY') {
        asset.totalQuantity += quantity;
        asset.costBasisToman += quantity * priceInToman + (feesToman || 0);
      } else if (type === 'SELL') {
        const avgBuyPrice =
          asset.totalQuantity > 0 ? asset.costBasisToman / asset.totalQuantity : priceInToman;
        const sellProceeds = quantity * priceInToman - (feesToman || 0);
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

    const assets = Object.values(assetsMap)
      .map((asset) => {
        asset.name = getAssetDetail(asset.symbol, language).name;
        asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
        asset.unrealizedPnlToman = asset.currentValueToman - asset.costBasisToman;
        asset.pnlToman = asset.unrealizedPnlToman + asset.realizedPnlToman;
        asset.pnlPercent =
          asset.costBasisToman > 0 ? (asset.unrealizedPnlToman / asset.costBasisToman) * 100 : 0;
        asset.change24h =
          prices.changes24h?.[asset.symbol] ??
          (asset.symbol === 'GOLD18'
            ? prices.changes24h?.IR_GOLD_18K
            : asset.symbol === 'SEKKEH'
              ? prices.changes24h?.IR_COIN_EMAMI
              : asset.symbol === 'BAHAR'
                ? prices.changes24h?.IR_COIN_BAHAR
                : asset.symbol === 'NIM'
                  ? prices.changes24h?.IR_COIN_HALF
                  : asset.symbol === 'ROB'
                    ? prices.changes24h?.IR_COIN_QUARTER
                    : asset.symbol === 'GRAM_COIN'
                      ? prices.changes24h?.IR_COIN_1G
                      : asset.symbol === 'ABSHODEH'
                        ? prices.changes24h?.IR_GOLD_MELTED
                        : undefined);

        runningTotalValue += asset.currentValueToman;
        runningTotalCost += asset.costBasisToman;
        runningTotalRealized += asset.realizedPnlToman;
        runningTotalUnrealized += asset.unrealizedPnlToman;
        return asset;
      })
      // Keep active holdings (or fully sold assets that still carry realized PnL if needed, filter active > 0 for holdings list)
      .filter((a) => a.totalQuantity > 0.000001);

    assets.forEach((a) => {
      a.allocationPercent =
        runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0;
    });

    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: runningTotalUnrealized + runningTotalRealized,
      totalPnlPercent:
        runningTotalCost > 0 ? (runningTotalUnrealized / runningTotalCost) * 100 : 0,
      totalRealizedPnlToman: runningTotalRealized,
      totalUnrealizedPnlToman: runningTotalUnrealized,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman),
    };
  }, [transactions, prices, language]);

  // Accurate Best & Worst Performer sorted strictly by PnL Percentage (NOT currentValueToman!)
  const { bestPerformer, worstPerformer } = useMemo(() => {
    const ranked = [...portfolioSummary.assets]
      .filter((a) => a.costBasisToman > 0)
      .sort((a, b) => b.pnlPercent - a.pnlPercent);

    if (ranked.length === 0) return { bestPerformer: null, worstPerformer: null };
    return {
      bestPerformer: ranked[0],
      worstPerformer: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  }, [portfolioSummary.assets]);

  const selectedAsset = useMemo(
    () => portfolioSummary.assets.find((a) => a.symbol === selectedAssetSymbol) || null,
    [portfolioSummary.assets, selectedAssetSymbol]
  );

  const filteredAssets = useMemo(() => {
    const q = deferredHoldingsSearch.trim().toLowerCase();
    return portfolioSummary.assets.filter((a) => {
      if (holdingCategory !== 'ALL' && a.type !== holdingCategory) return false;
      if (q) {
        const enName = getAssetDetail(a.symbol, 'en').name.toLowerCase();
        const faName = getAssetDetail(a.symbol, 'fa').name.toLowerCase();
        return (
          a.symbol.toLowerCase().includes(q) || enName.includes(q) || faName.includes(q)
        );
      }
      return true;
    });
  }, [portfolioSummary.assets, holdingCategory, deferredHoldingsSearch]);

  const handleLogout = useCallback(() => {
    AuthService.logout();
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
    setUser(null);
    setIsSettingsDrawerOpen(false);
    setIsAdminPanelOpen(false);
  }, []);

  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#090d16]" />}>
        <LoginPage onLoginSuccess={setUser} />
      </Suspense>
    );
  }

  const cardSurface =
    'bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)]';
  const tomanShort = language === 'en' ? 'T' : 'ت';

  const getUnitShort = (asset: Pick<AssetSummary, 'symbol' | 'type'>) => {
    if (isCoinAsset(asset.symbol)) return language === 'en' ? 'pcs' : 'عدد';
    if (asset.symbol === 'ABSHODEH') return language === 'en' ? 'mithqal' : 'مثقال';
    if (asset.symbol === 'USD_XAU' || asset.symbol === 'XAG') return language === 'en' ? 'oz' : 'انس';
    if (asset.type === 'GOLD') return language === 'en' ? 'g' : 'گرم';
    return asset.symbol;
  };

  return (
    <Layout
      theme={resolvedTheme}
      navbar={
        <Navbar
          user={user}
          displayName={displayName}
          currentTab={tab}
          onTabChange={navigateTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          onOpenNewTx={() => openNewTxWithAsset()}
          holdingsCount={portfolioSummary.assets.length}
          transactionsCount={transactions.length}
        />
      }
    >
      {/* ================= TAB 1: OVERVIEW ================= */}
      {tab === 'overview' && (
        <PullToRefresh
          onRefresh={async () => {
            await handlePriceUpdate();
          }}
          disabled={isPriceUpdating}
        >
          <div>
            {loading ? (
              <SummaryCardSkeleton />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Column (8 cols on desktop) */}
                <div className="lg:col-span-8 min-w-0 space-y-6">
                  <SummaryCard
                    summary={portfolioSummary}
                    isRefreshing={isPriceUpdating}
                    lastUpdated={prices?.fetchedAt || Date.now()}
                    onRefresh={handlePriceUpdate}
                    prices={prices}
                  />

                  <Suspense
                    fallback={
                      <div className={`${cardSurface} rounded-[20px] h-[310px] p-6 animate-pulse`} />
                    }
                  >
                    <PortfolioHistoryChart
                      transactions={transactions}
                      prices={prices}
                      currentTotalValue={portfolioSummary.totalValueToman}
                      currentCostBasis={portfolioSummary.totalCostBasisToman}
                    />
                  </Suspense>

                  {/* Top Holdings Breakdown */}
                  <section className={`${cardSurface} rounded-[20px] p-5 sm:p-6 shadow-sm`}>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2.5">
                        <Layers size={18} className="text-[var(--brand-primary)]" />
                        <h3 className="font-bold text-sm sm:text-base text-[color:var(--text-primary)]">
                          {language === 'en' ? 'Top Holdings Breakdown' : 'ترکیب دارایی‌های برتر'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          haptic('light');
                          navigateTab('holdings');
                        }}
                        className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                      >
                        <span>{language === 'en' ? 'View All' : 'مشاهده همه'}</span>
                        <ArrowRight size={14} className={language === 'en' ? '' : 'rotate-180'} />
                      </button>
                    </div>

                    {portfolioSummary.assets.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[color:var(--text-muted)] text-xs font-semibold">
                          {language === 'en'
                            ? 'No assets added yet'
                            : 'هنوز دارایی‌ای در سبد ثبت نکرده‌اید'}
                        </p>
                        <button
                          type="button"
                          onClick={() => openNewTxWithAsset()}
                          className="mt-3 min-h-[40px] px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-gold transition-colors"
                        >
                          {language === 'en' ? '+ Record First Purchase' : '+ ثبت اولین خرید'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portfolioSummary.assets.slice(0, 5).map((asset) => {
                          const isProfit = asset.pnlToman >= 0;
                          return (
                            <button
                              key={asset.symbol}
                              type="button"
                              onClick={() => {
                                haptic('light');
                                setSelectedAssetSymbol(asset.symbol);
                              }}
                              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] transition-colors text-start border border-transparent hover:border-[color:var(--border-color)]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center shrink-0">
                                  <img
                                    src={getAssetIconUrl(asset.symbol)}
                                    alt={asset.symbol}
                                    width={28}
                                    height={28}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getAssetFallbackIcon(
                                        asset.symbol
                                      );
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-[color:var(--text-primary)] truncate">
                                    {getAssetDetail(asset.symbol, language).name}
                                  </div>
                                  <div
                                    className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5 tabular-nums"
                                    dir="ltr"
                                  >
                                    {formatNumber(asset.totalQuantity, 4, language)}{' '}
                                    {getUnitShort(asset)}
                                  </div>
                                </div>
                              </div>

                              <div className="text-end shrink-0 tabular-nums" dir="ltr">
                                <div className="font-bold text-sm text-[color:var(--text-primary)]">
                                  {formatToman(asset.currentValueToman, language)}{' '}
                                  <span className="text-xs text-[color:var(--text-muted)] font-medium">
                                    {tomanShort}
                                  </span>
                                </div>
                                <div
                                  className={`text-xs font-bold mt-0.5 ${
                                    isProfit
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {formatPercent(asset.pnlPercent, language)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* Sidebar Column (4 cols on desktop) */}
                <div className="lg:col-span-4 min-w-0 space-y-6">
                  <AllocationChart summary={portfolioSummary} />

                  {/* Accurate Best & Worst Performers (by PnL %) */}
                  <div className="flex flex-col gap-3.5">
                    {/* Best Performer */}
                    <button
                      type="button"
                      disabled={!bestPerformer}
                      onClick={() => bestPerformer && setSelectedAssetSymbol(bestPerformer.symbol)}
                      className={`${cardSurface} p-5 rounded-[20px] shadow-sm flex flex-col justify-between text-start transition-colors hover:border-emerald-500/40 disabled:cursor-default`}
                    >
                      <div className="flex items-center justify-between w-full mb-3 gap-2">
                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                          <ArrowUpRight size={16} />
                          <span>{t('summary.bestPerformer')}</span>
                        </span>
                        {bestPerformer && (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 tabular-nums"
                            dir="ltr"
                          >
                            {formatPercent(bestPerformer.pnlPercent, language)}
                          </span>
                        )}
                      </div>
                      {bestPerformer ? (
                        <div className="space-y-2 w-full">
                          <div className="font-bold text-base text-[color:var(--text-primary)] flex items-center justify-between gap-2">
                            <span className="truncate">
                              {getAssetDetail(bestPerformer.symbol, language).name}
                            </span>
                            <span className="text-xs text-[color:var(--text-muted)] font-mono shrink-0">
                              {bestPerformer.symbol}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[color:var(--text-muted)] flex justify-between items-center pt-2 border-t border-[color:var(--border-color)] tabular-nums">
                            <span>{t('summary.netProfit')}</span>
                            <span
                              className={`font-bold ${
                                bestPerformer.pnlToman >= 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-700 dark:text-rose-400'
                              }`}
                              dir="ltr"
                            >
                              {bestPerformer.pnlToman >= 0 ? '+' : ''}
                              {formatToman(bestPerformer.pnlToman, language)} {tomanShort}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[color:var(--text-muted)] text-xs py-2 font-medium">
                          {t('summary.noHoldings')}
                        </div>
                      )}
                    </button>

                    {/* Worst Performer */}
                    <button
                      type="button"
                      disabled={!worstPerformer}
                      onClick={() => worstPerformer && setSelectedAssetSymbol(worstPerformer.symbol)}
                      className={`${cardSurface} p-5 rounded-[20px] shadow-sm flex flex-col justify-between text-start transition-colors hover:border-rose-500/40 disabled:cursor-default`}
                    >
                      <div className="flex items-center justify-between w-full mb-3 gap-2">
                        <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                          <ArrowDownRight size={16} />
                          <span>{t('summary.worstPerformer')}</span>
                        </span>
                        {worstPerformer && (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg tabular-nums ${
                              worstPerformer.pnlPercent >= 0
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            }`}
                            dir="ltr"
                          >
                            {formatPercent(worstPerformer.pnlPercent, language)}
                          </span>
                        )}
                      </div>
                      {worstPerformer ? (
                        <div className="space-y-2 w-full">
                          <div className="font-bold text-base text-[color:var(--text-primary)] flex items-center justify-between gap-2">
                            <span className="truncate">
                              {getAssetDetail(worstPerformer.symbol, language).name}
                            </span>
                            <span className="text-xs text-[color:var(--text-muted)] font-mono shrink-0">
                              {worstPerformer.symbol}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[color:var(--text-muted)] flex justify-between items-center pt-2 border-t border-[color:var(--border-color)] tabular-nums">
                            <span>{language === 'en' ? 'Net PnL:' : 'سود / زیان:'}</span>
                            <span
                              className={`font-bold ${
                                worstPerformer.pnlToman >= 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-700 dark:text-rose-400'
                              }`}
                              dir="ltr"
                            >
                              {worstPerformer.pnlToman >= 0 ? '+' : ''}
                              {formatToman(worstPerformer.pnlToman, language)} {tomanShort}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[color:var(--text-muted)] text-xs py-2 font-medium">
                          {language === 'en'
                            ? 'Add at least 2 assets to compare'
                            : 'حداقل دو دارایی برای مقایسه نیاز است'}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Unified Single-Tone Quick Tools */}
                  <section className={`${cardSurface} rounded-[20px] p-5 sm:p-6 shadow-sm space-y-2.5`}>
                    <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-3">
                      {t('quickTools')}
                    </h3>

                    {[
                      {
                        icon: Calculator,
                        title: t('goldBubbleCalc'),
                        desc: t('goldBubbleDesc'),
                        onClick: () => setIsGoldBubbleOpen(true),
                      },
                      {
                        icon: Layers,
                        title: t('dcaCalculator'),
                        desc: t('dcaCalcDesc'),
                        onClick: () => setIsDcaModalOpen(true),
                      },
                      {
                        icon: Download,
                        title: t('backupExport'),
                        desc: t('backupDesc'),
                        onClick: () => setIsExportImportOpen(true),
                      },
                      {
                        icon: Search,
                        title:
                          language === 'en'
                            ? 'Command Palette (⌘K)'
                            : 'پالت دستورات و تبدیل زنده (⌘K)',
                        desc:
                          language === 'en'
                            ? 'Instant currency calculator & spotlight'
                            : 'ماشین‌حساب لحظه‌ای تبدیل ارز و جستجو',
                        onClick: () => setIsCommandPaletteOpen(true),
                      },
                    ].map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <button
                          key={tool.title}
                          type="button"
                          onClick={() => {
                            haptic('light');
                            tool.onClick();
                          }}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] hover:border-[var(--brand-border)] text-start transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                              <ToolIcon size={17} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-[color:var(--text-primary)] truncate">
                                {tool.title}
                              </div>
                              <div className="text-xs text-[color:var(--text-muted)] truncate mt-0.5">
                                {tool.desc}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            className={`text-[color:var(--text-muted)] group-hover:text-[var(--brand-primary)] shrink-0 transition-colors ${
                              language === 'en' ? '' : 'rotate-180'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </section>

                  {/* Price Sources Box */}
                  <section className={`${cardSurface} rounded-[20px] p-5 sm:p-6 shadow-sm`}>
                    <h3 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wider mb-3">
                      {t('priceSources')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(sources.length > 0 ? sources : fallbackSources).map((s, i) => (
                        <a
                          key={i}
                          href={s.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-xs font-semibold border border-[color:var(--border-color)] transition-colors"
                        >
                          <span>{s.title}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </PullToRefresh>
      )}

      {/* ================= TAB 2: HOLDINGS ================= */}
      {tab === 'holdings' && (
        <div className="space-y-5">
          {/* Search & Actions Bar */}
          <div
            className={`${cardSurface} rounded-[20px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3`}
          >
            <div className="w-full sm:max-w-md relative">
              <Search
                size={17}
                className={`absolute ${
                  language === 'en' ? 'left-3.5' : 'right-3.5'
                } top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none`}
              />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={holdingsSearch}
                onChange={(e) => setHoldingsSearch(e.target.value)}
                className={`w-full min-h-[44px] bg-[var(--muted-surface)] rounded-xl py-2.5 ${
                  language === 'en' ? 'pl-10 pr-9' : 'pr-10 pl-9'
                } text-base sm:text-xs font-semibold focus:outline-none focus:border-[var(--brand-primary)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] transition-colors`}
              />
              {holdingsSearch && (
                <button
                  type="button"
                  onClick={() => setHoldingsSearch('')}
                  className={`absolute ${
                    language === 'en' ? 'right-2.5' : 'left-2.5'
                  } top-1/2 -translate-y-1/2 p-1 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]`}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setIsGoldBubbleOpen(true);
                }}
                className="min-h-[40px] px-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] text-[color:var(--text-primary)] border border-[color:var(--border-color)] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Calculator size={15} className="text-[var(--brand-primary)]" />
                <span>{language === 'en' ? 'Gold Bubble' : 'حباب طلا'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setIsDcaModalOpen(true);
                }}
                className="min-h-[40px] px-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] text-[color:var(--text-primary)] border border-[color:var(--border-color)] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Layers size={15} className="text-[var(--brand-primary)]" />
                <span>{language === 'en' ? 'DCA' : 'میانگین‌کم‌کنی'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('success');
                  openNewTxWithAsset();
                }}
                className="min-h-[40px] px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold flex items-center gap-1.5 shadow-gold transition-colors"
              >
                <Plus size={16} strokeWidth={2.75} />
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
              title={t('holdings.emptyHoldingsTitle')}
              description={t('holdings.emptyHoldingsDesc')}
              actionLabel={t('addTransaction')}
              onAction={() => openNewTxWithAsset()}
            />
          ) : (
            <>
              {/* Desktop Institutional Data Table */}
              <div className="hidden md:block overflow-hidden rounded-[20px] border border-[color:var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-[var(--muted-surface)] border-b border-[color:var(--border-color)] text-xs font-bold text-[color:var(--text-muted)]">
                        <th className="p-4 ps-6 text-start">{t('assetSymbol')}</th>
                        <th className="p-4 text-start">{t('type')}</th>
                        <th className="p-4 text-end">{t('quantity')}</th>
                        <th className="p-4 text-end">{t('currentPrice')}</th>
                        <th className="p-4 text-end">{t('totalValue')}</th>
                        <th className="p-4 text-end">{t('pnl')}</th>
                        <th className="p-4 text-end">{t('holdings.portfolioShare')}</th>
                        <th className="p-4 pe-6 text-center">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-color)] text-xs">
                      {filteredAssets.map((asset) => {
                        const isProfit = asset.pnlToman >= 0;
                        return (
                          <tr
                            key={asset.symbol}
                            onClick={() => setSelectedAssetSymbol(asset.symbol)}
                            className="hover:bg-[var(--muted-surface)] transition-colors cursor-pointer"
                          >
                            <td className="p-4 ps-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center shrink-0">
                                  <img
                                    src={getAssetIconUrl(asset.symbol)}
                                    alt={asset.symbol}
                                    width={28}
                                    height={28}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getAssetFallbackIcon(
                                        asset.symbol
                                      );
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-[color:var(--text-primary)]">
                                    {getAssetDetail(asset.symbol, language).name}
                                  </div>
                                  <div className="text-xs text-[color:var(--text-muted)] font-mono">
                                    {asset.symbol}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--muted-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]">
                                {asset.type === 'GOLD'
                                  ? language === 'en'
                                    ? 'Gold & Coins'
                                    : 'طلا و سکه'
                                  : asset.type === 'CRYPTO'
                                    ? language === 'en'
                                      ? 'Crypto'
                                      : 'رمزارز'
                                    : language === 'en'
                                      ? 'Fiat'
                                      : 'ارز فیات'}
                              </span>
                            </td>

                            <td
                              className="p-4 text-end font-bold text-[color:var(--text-primary)] tabular-nums"
                              dir="ltr"
                            >
                              {formatNumber(asset.totalQuantity, 4, language)}{' '}
                              <span className="text-[color:var(--text-muted)] font-medium">
                                {getUnitShort(asset)}
                              </span>
                            </td>

                            <td
                              className="p-4 text-end font-semibold text-[color:var(--text-muted)] tabular-nums"
                              dir="ltr"
                            >
                              {formatToman(asset.currentPriceToman, language)} {tomanShort}
                            </td>

                            <td
                              className="p-4 text-end font-extrabold text-[color:var(--text-primary)] text-sm tabular-nums"
                              dir="ltr"
                            >
                              {formatToman(asset.currentValueToman, language)} {tomanShort}
                            </td>

                            <td className="p-4 text-end font-bold tabular-nums" dir="ltr">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                                  isProfit
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {formatPercent(asset.pnlPercent, language)}
                              </span>
                            </td>

                            <td
                              className="p-4 text-end font-bold text-[color:var(--text-muted)] tabular-nums"
                              dir="ltr"
                            >
                              {Math.round(asset.allocationPercent)}%
                            </td>

                            <td
                              className="p-4 pe-6 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openNewTxWithAsset(asset.symbol, 'BUY')}
                                  className="min-h-[34px] px-3 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] hover:bg-[var(--brand-primary)] hover:text-white text-xs font-bold transition-colors"
                                >
                                  + {t('buy')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAssetSymbol(asset.symbol)}
                                  className="min-h-[34px] px-3 rounded-lg bg-[var(--muted-surface)] text-[color:var(--text-primary)] border border-[color:var(--border-color)] hover:bg-[var(--pill-bg)] text-xs font-semibold transition-colors"
                                >
                                  {language === 'en' ? 'Details' : 'جزئیات'}
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
                {filteredAssets.map((asset) => (
                  <AssetRow
                    key={asset.symbol}
                    asset={asset}
                    onClick={() => {
                      haptic('light');
                      setSelectedAssetSymbol(asset.symbol);
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
        <div className="space-y-5">
          {/* Header with Title & Quick Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[color:var(--text-primary)]">
                  {t('txHistory')}
                </h2>
                <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5 tabular-nums">
                  {language === 'en'
                    ? `${transactions.length} transactions recorded`
                    : `${formatNumber(transactions.length, 0, language)} تراکنش ثبت‌شده در پورتفوی`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setIsExportImportOpen(true);
                }}
                className="min-h-[40px] px-3.5 rounded-xl border border-[color:var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--muted-surface)] text-[color:var(--text-primary)] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Backup / CSV' : 'خروجی اکسل / بکاپ'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic('success');
                  openNewTxWithAsset();
                }}
                className="min-h-[40px] px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold flex items-center gap-1.5 shadow-gold active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={2.75} />
                <span>{t('recordNewTx')}</span>
              </button>
            </div>
          </div>

          {/* Transaction Filter Toolbar */}
          <div className={`${cardSurface} rounded-[20px] p-4 sm:p-5 shadow-sm`}>
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
              title={t('transactions.emptyTx')}
              description={
                language === 'en'
                  ? 'Record your first trade to track realized & unrealized performance.'
                  : 'با ثبت اولین معامله خود، تاریخچه کامل خرید و فروش را اینجا مشاهده کنید.'
              }
              actionLabel={t('recordNewTx')}
              onAction={() => openNewTxWithAsset()}
            />
          ) : (
            (() => {
              const sortedDesc = [...transactions].sort(
                (a, b) => new Date(b.buyDateTime).getTime() - new Date(a.buyDateTime).getTime()
              );
              const filteredTxs = filterTransactions(sortedDesc, txFilters, (symbol) => {
                return getAssetDetail(symbol).type;
              });

              if (filteredTxs.length === 0) {
                return (
                  <div className={`${cardSurface} text-center py-14 rounded-[20px]`}>
                    <p className="text-[color:var(--text-muted)] font-semibold text-sm">
                      {language === 'en'
                        ? 'No transactions found matching your filter criteria'
                        : 'تراکنشی با این فیلترها یافت نشد'}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {/* Desktop Data Table */}
                  <div className="hidden md:block overflow-hidden rounded-[20px] border border-[color:var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="bg-[var(--muted-surface)] border-b border-[color:var(--border-color)] text-xs font-bold text-[color:var(--text-muted)]">
                            <th className="p-4 ps-6 text-start">{t('date')}</th>
                            <th className="p-4 text-start">{t('type')}</th>
                            <th className="p-4 text-start">{t('assetSymbol')}</th>
                            <th className="p-4 text-end">{t('quantity')}</th>
                            <th className="p-4 text-end">{t('unitPrice')}</th>
                            <th className="p-4 text-end">{t('transactions.totalCost')}</th>
                            <th className="p-4 text-start">{t('wallet')}</th>
                            <th className="p-4 text-start">{t('note')}</th>
                            <th className="p-4 pe-6 text-center">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--border-color)] text-xs">
                          {filteredTxs.map((tx) => {
                            const resolvedSym = resolveAssetSymbol(tx);
                            const detail = getAssetDetail(resolvedSym, language);
                            const isSell = tx.type === 'SELL';
                            const totalToman =
                              tx.buyCurrency === 'TOMAN'
                                ? tx.quantity * tx.buyPricePerUnit +
                                  (isSell ? -(tx.feesToman || 0) : tx.feesToman || 0)
                                : tx.quantity *
                                    tx.buyPricePerUnit *
                                    (prices?.usdToToman || 70000) +
                                  (isSell ? -(tx.feesToman || 0) : tx.feesToman || 0);

                            return (
                              <tr
                                key={tx.id}
                                className="hover:bg-[var(--muted-surface)] transition-colors"
                              >
                                <td
                                  className="p-4 ps-6 text-[color:var(--text-muted)] font-semibold tabular-nums"
                                  dir="ltr"
                                >
                                  {formatDateCached(tx.buyDateTime, language)}
                                </td>

                                <td className="p-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                      isSell
                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    }`}
                                  >
                                    {isSell ? t('transactions.typeSell') : t('transactions.typeBuy')}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--muted-surface)] p-1 border border-[color:var(--border-color)] flex items-center justify-center shrink-0">
                                      <img
                                        src={getAssetIconUrl(resolvedSym)}
                                        alt={resolvedSym}
                                        width={22}
                                        height={22}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            getAssetFallbackIcon(resolvedSym);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div className="font-bold text-[color:var(--text-primary)]">
                                        {detail.name}
                                      </div>
                                      <div className="text-xs text-[color:var(--text-muted)] font-mono">
                                        {resolvedSym}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td
                                  className="p-4 text-end font-bold text-[color:var(--text-primary)] tabular-nums"
                                  dir="ltr"
                                >
                                  {formatNumber(tx.quantity, 4, language)}
                                </td>

                                <td
                                  className="p-4 text-end font-semibold text-[color:var(--text-muted)] tabular-nums"
                                  dir="ltr"
                                >
                                  {formatNumber(tx.buyPricePerUnit, 2, language)}{' '}
                                  {tx.buyCurrency === 'USD' ? '$' : tomanShort}
                                </td>

                                <td
                                  className="p-4 text-end font-extrabold text-[color:var(--text-primary)] tabular-nums"
                                  dir="ltr"
                                >
                                  {formatToman(Math.max(0, totalToman), language)} {tomanShort}
                                </td>

                                <td className="p-4">
                                  {tx.wallet ? (
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
                                      {tx.wallet}
                                    </span>
                                  ) : (
                                    <span className="text-[color:var(--text-muted)]">-</span>
                                  )}
                                </td>

                                <td className="p-4 text-[color:var(--text-muted)] text-xs truncate max-w-[160px]">
                                  {tx.note || (tx.tags && tx.tags.length ? tx.tags.join(' ') : '-')}
                                </td>

                                <td className="p-4 pe-6 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        haptic('light');
                                        setEditingTransaction(tx);
                                        setIsTxModalOpen(true);
                                      }}
                                      className="min-w-[34px] min-h-[34px] rounded-lg bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] text-[color:var(--text-primary)] flex items-center justify-center transition-colors"
                                      title={t('edit')}
                                      aria-label={t('edit')}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        haptic('error');
                                        setPendingDeleteTxId(tx.id);
                                      }}
                                      className="min-w-[34px] min-h-[34px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors"
                                      title={t('delete')}
                                      aria-label={t('delete')}
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

                  {/* Complete Mobile Transaction Cards (Includes BUY/SELL badge, Unit Price, Total Toman, SVG Wallet icon) */}
                  <div className="md:hidden space-y-3">
                    {filteredTxs.map((tx) => {
                      const resolvedSym = resolveAssetSymbol(tx);
                      const detail = getAssetDetail(resolvedSym, language);
                      const isSell = tx.type === 'SELL';
                      const totalToman =
                        tx.buyCurrency === 'TOMAN'
                          ? tx.quantity * tx.buyPricePerUnit +
                            (isSell ? -(tx.feesToman || 0) : tx.feesToman || 0)
                          : tx.quantity * tx.buyPricePerUnit * (prices?.usdToToman || 70000) +
                            (isSell ? -(tx.feesToman || 0) : tx.feesToman || 0);

                      return (
                        <div
                          key={tx.id}
                          onClick={() => {
                            haptic('light');
                            setEditingTransaction(tx);
                            setIsTxModalOpen(true);
                          }}
                          className={`${cardSurface} p-4 rounded-[20px] flex flex-col gap-3 cursor-pointer hover:border-[var(--brand-border)] transition-colors shadow-sm`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center shrink-0">
                                <img
                                  src={getAssetIconUrl(resolvedSym)}
                                  alt={resolvedSym}
                                  width={28}
                                  height={28}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      getAssetFallbackIcon(resolvedSym);
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-[color:var(--text-primary)] truncate">
                                    {detail.name}
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                      isSell
                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    }`}
                                  >
                                    {isSell ? t('transactions.typeSell') : t('transactions.typeBuy')}
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-[color:var(--text-muted)] mt-0.5 tabular-nums">
                                  {formatDateCached(tx.buyDateTime, language)}
                                </div>
                              </div>
                            </div>

                            <div className="text-end shrink-0 tabular-nums" dir="ltr">
                              <div className="font-extrabold text-sm text-[color:var(--text-primary)]">
                                {formatToman(Math.max(0, totalToman), language)}{' '}
                                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                                  {tomanShort}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-[color:var(--text-muted)] mt-0.5">
                                {formatNumber(tx.quantity, 4, language)} ×{' '}
                                {formatNumber(tx.buyPricePerUnit, 2, language)}{' '}
                                {tx.buyCurrency === 'USD' ? '$' : tomanShort}
                              </div>
                            </div>
                          </div>

                          {(tx.wallet || (tx.tags && tx.tags.length > 0) || tx.note) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[color:var(--border-color)]">
                              {tx.wallet && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
                                  <Wallet size={12} />
                                  <span>{tx.wallet}</span>
                                </span>
                              )}
                              {tx.tags?.map((tg) => (
                                <span
                                  key={tg}
                                  className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--muted-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]"
                                >
                                  {tg}
                                </span>
                              ))}
                              {tx.note && (
                                <span className="text-xs text-[color:var(--text-muted)] truncate max-w-full">
                                  {tx.note}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}

      {/* ================= TAB 4: MARKET BOARD ================= */}
      {tab === 'market' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[45vh]">
              <div className="w-9 h-9 rounded-full border-2 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)] animate-spin" />
            </div>
          }
        >
          <MarketBoard
            prices={prices}
            onRefreshPrices={handlePriceUpdate}
            isPriceUpdating={isPriceUpdating}
            onOpenNewTxWithAsset={(sym) => openNewTxWithAsset(sym, 'BUY')}
            onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
          />
        </Suspense>
      )}

      {/* Mobile Thumb-Zone Bottom Dock (with centered '+' CTA) */}
      <BottomNav
        currentTab={tab}
        onTabChange={navigateTab}
        onOpenNewTx={() => openNewTxWithAsset()}
      />

      {/* Guarded Lazy Modals & Drawers (Isolated Suspense — never unmounts main page!) */}
      <Suspense fallback={null}>
        {selectedAsset && (
          <AssetDetailDrawer
            asset={selectedAsset}
            transactions={transactions}
            usdToToman={prices?.usdToToman || 70000}
            onClose={() => setSelectedAssetSymbol(null)}
            onOpenNewTx={(sym, tradeType = 'BUY') => {
              setSelectedAssetSymbol(null);
              openNewTxWithAsset(sym, tradeType);
            }}
            onEditTransaction={(tx) => {
              setSelectedAssetSymbol(null);
              setEditingTransaction(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={(txId) => {
              setPendingDeleteTxId(txId);
            }}
          />
        )}

        {isTxModalOpen && (
          <TransactionModal
            isOpen={isTxModalOpen}
            initialData={editingTransaction}
            defaultAssetSymbol={defaultAssetForNewTx}
            defaultType={defaultTxType}
            prices={prices}
            portfolioAssets={portfolioSummary.assets}
            onClose={() => {
              setIsTxModalOpen(false);
              setEditingTransaction(null);
              setDefaultAssetForNewTx(null);
            }}
            onSave={handleSaveTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}

        {isGoldBubbleOpen && (
          <GoldBubbleModal
            isOpen={isGoldBubbleOpen}
            onClose={() => setIsGoldBubbleOpen(false)}
            prices={prices}
            onRefreshPrices={handlePriceUpdate}
          />
        )}

        {isExportImportOpen && (
          <ExportImportModal
            isOpen={isExportImportOpen}
            onClose={() => setIsExportImportOpen(false)}
            transactions={transactions}
            username={user.username}
            prices={prices}
            onImportSuccess={handleImportSuccess}
          />
        )}

        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            prices={prices}
            onOpenNewTransaction={(sym) => openNewTxWithAsset(sym, 'BUY')}
            onOpenGoldBubble={() => setIsGoldBubbleOpen(true)}
            onOpenExportImport={() => setIsExportImportOpen(true)}
            onRefreshPrices={handlePriceUpdate}
            onOpenSettings={() => setIsSettingsDrawerOpen(true)}
            onOpenAdmin={user.isAdmin ? () => setIsAdminPanelOpen(true) : undefined}
            isAdmin={user.isAdmin}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          />
        )}

        {isSettingsDrawerOpen && (
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
        )}

        {isDcaModalOpen && (
          <DcaCalculatorModal
            isOpen={isDcaModalOpen}
            onClose={() => setIsDcaModalOpen(false)}
            portfolioAssets={portfolioSummary.assets}
            prices={prices}
          />
        )}

        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      </Suspense>

      {/* Non-blocking Accessible Delete Confirmation (replaces window.confirm) */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTxId)}
        title={t('tx.deleteConfirmTitle')}
        message={t('tx.deleteConfirmMessage')}
        confirmLabel={t('tx.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteTxId) {
            handleDeleteTransaction(pendingDeleteTxId);
            setPendingDeleteTxId(null);
          }
        }}
        onCancel={() => setPendingDeleteTxId(null)}
      />
    </Layout>
  );
}
