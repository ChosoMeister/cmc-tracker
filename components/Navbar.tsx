import React from 'react';
import { 
  Shield, 
  Sparkles, 
  Search, 
  Calculator, 
  Download, 
  UserCircle, 
  RefreshCw, 
  Plus, 
  LogOut, 
  LayoutDashboard, 
  PieChart, 
  History
} from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface NavbarProps {
  user: { username: string; isAdmin: boolean; displayName?: string };
  displayName: string;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenGoldBubble: () => void;
  onOpenExportImport: () => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  onPriceUpdate: () => void;
  isPriceUpdating: boolean;
  onOpenNewTx: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  holdingsCount: number;
  transactionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  displayName,
  currentTab,
  onTabChange,
  onOpenCommandPalette,
  onOpenGoldBubble,
  onOpenExportImport,
  onOpenSettings,
  onOpenAdmin,
  onPriceUpdate,
  isPriceUpdating,
  onOpenNewTx,
  onLogout,
  holdingsCount,
  transactionsCount
}) => {
  const { haptic } = useHaptics();

  const navTabs = [
    { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
    { id: 'holdings', label: 'دارایی‌ها', icon: PieChart, count: holdingsCount },
    { id: 'transactions', label: 'تراکنش‌ها', icon: History, count: transactionsCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0b1224]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
          
          {/* Right Section: Brand & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md sm:shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20 shrink-0">
              <Shield size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-lg tracking-tight text-slate-800 dark:text-white truncate max-w-[110px] sm:max-w-[200px]">
                  {displayName || 'سبد دارایی'}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {user.username}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                  مدیریت پورتفوی
                </span>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-indigo-500/20">
                  <Sparkles size={8} /> هوش مصنوعی
                </span>
              </div>
            </div>
          </div>

          {/* Center Section: Desktop Navigation Tabs (Hidden on Mobile) */}
          <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic('selection');
                    onTabChange(tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Left Section: Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Search Button (Always visible) */}
            <button
              onClick={() => {
                haptic('light');
                onOpenCommandPalette();
              }}
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2 text-xs font-bold"
              title="جستجوی سریع و پالت دستورات (⌘K)"
            >
              <Search size={16} className="text-blue-500" />
              <span className="hidden lg:inline text-[11px] text-slate-400 dark:text-slate-500">جستجو و تبدیل...</span>
              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">⌘K</kbd>
            </button>

            {/* Desktop-Only: Gold Bubble Tool */}
            <button
              onClick={() => {
                haptic('light');
                onOpenGoldBubble();
              }}
              className="hidden md:flex p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all"
              title="محاسبه‌گر حباب طلا و سکه"
            >
              <Calculator size={18} />
            </button>

            {/* Desktop-Only: Export & Import */}
            <button
              onClick={() => {
                haptic('light');
                onOpenExportImport();
              }}
              className="hidden md:flex p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all"
              title="خروجی و ورودی اکسل / بکاپ JSON"
            >
              <Download size={18} />
            </button>

            {/* Desktop-Only: Live Refresh Button */}
            <button
              onClick={() => {
                haptic('medium');
                onPriceUpdate();
              }}
              disabled={isPriceUpdating}
              className={`hidden md:flex p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all ${
                isPriceUpdating ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="بروزرسانی زنده نرخ‌های ارز و طلا"
            >
              <RefreshCw size={18} className={isPriceUpdating ? "animate-spin text-blue-500" : ""} />
            </button>

            {/* Add Transaction Button (Compact on mobile, full on desktop) */}
            <button
              onClick={() => {
                haptic('success');
                onOpenNewTx();
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md sm:shadow-lg shadow-blue-600/25 active:scale-95 transition-all shrink-0"
              title="ثبت تراکنش جدید"
            >
              <Plus size={16} strokeWidth={3} />
              <span className="hidden sm:inline">ثبت تراکنش</span>
            </button>

            {/* User Profile & Drawer Trigger (Always visible) */}
            <button
              onClick={() => {
                haptic('light');
                onOpenSettings();
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all shrink-0"
              title="پروفایل و تنظیمات"
            >
              <UserCircle size={18} />
            </button>

            {/* Desktop-Only: Admin Panel */}
            {user.isAdmin && onOpenAdmin && (
              <button
                onClick={() => {
                  haptic('light');
                  onOpenAdmin();
                }}
                className="hidden md:flex p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-all shrink-0"
                title="پنل مدیریت ادمین"
              >
                <Shield size={18} />
              </button>
            )}

            {/* Desktop-Only: Logout */}
            <button
              onClick={() => {
                haptic('error');
                onLogout();
              }}
              className="hidden md:flex p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all shrink-0"
              title="خروج از حساب"
            >
              <LogOut size={18} />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
