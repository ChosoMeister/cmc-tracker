import React, { memo } from 'react';
import {
  Search,
  UserCircle,
  Plus,
  LayoutDashboard,
  PieChart,
  History,
  TrendingUp,
  Languages,
} from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useTranslation } from '../contexts/LanguageContext';

interface NavbarProps {
  user: { username: string; isAdmin: boolean; displayName?: string };
  displayName: string;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenNewTx: () => void;
  holdingsCount: number;
  transactionsCount: number;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  user,
  displayName,
  currentTab,
  onTabChange,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenNewTx,
  holdingsCount,
  transactionsCount,
}) => {
  const { t, language, toggleLanguage } = useTranslation();
  const { haptic } = useHaptics();

  const navTabs = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'holdings', label: t('nav.holdings'), icon: PieChart, count: holdingsCount },
    { id: 'market', label: t('nav.market'), icon: TrendingUp },
    { id: 'transactions', label: t('nav.transactions'), icon: History, count: transactionsCount },
  ];

  const initials = (displayName || user.username || 'Z').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-[color:var(--border-color)] pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Identity (Zero AI-Slop Sparkles) */}
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-3 shrink-0 text-start group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
              Z
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-[color:var(--text-primary)] whitespace-nowrap">
                  {displayName || (language === 'en' ? 'Personal Portfolio' : 'پرتفوی شخصی')}
                </span>
                <span className="hidden lg:inline-block text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--muted-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-color)]">
                  @{user.username}
                </span>
              </div>
              <span className="hidden sm:block text-xs text-[color:var(--text-muted)] font-medium">
                {language === 'en' ? 'Zarfolio Wealth Terminal' : 'ترمینال مدیریت دارایی زرفولیو'}
              </span>
            </div>
          </button>

          {/* Center: 4 Primary Desktop Tabs */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center bg-[var(--muted-surface)] p-1 rounded-xl border border-[color:var(--border-color)]"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptic('selection');
                    onTabChange(tab.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[var(--card-bg)] text-[color:var(--text-primary)] shadow-sm border border-[color:var(--border-color)]'
                      : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  <Icon
                    size={15}
                    className={isActive ? 'text-[var(--brand-primary)]' : ''}
                  />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                        isActive
                          ? 'bg-[var(--brand-soft)] text-[var(--brand-primary)]'
                          : 'bg-[var(--pill-bg)] text-[color:var(--text-muted)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* End: Focused 4 Controls (Cmd+K Search, Lang, Primary CTA on Desktop, Profile/Settings) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptic('light');
                onOpenCommandPalette();
              }}
              className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors flex items-center gap-2 text-xs font-semibold"
              title={`${t('nav.searchKbd')} (⌘K)`}
              aria-label={t('nav.searchKbd')}
            >
              <Search size={16} />
              <span className="hidden xl:inline">{t('nav.searchKbd')}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs rounded-md bg-[var(--card-bg)] border border-[color:var(--border-color)] font-mono">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic('light');
                toggleLanguage();
              }}
              className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            >
              <Languages size={15} className="text-[color:var(--text-muted)]" />
              <span>{language === 'fa' ? 'EN' : 'فا'}</span>
            </button>

            {/* Primary Bullion Gold CTA (Desktop/Tablet — Mobile uses thumb-zone BottomNav center '+') */}
            <button
              type="button"
              onClick={() => {
                haptic('success');
                onOpenNewTx();
              }}
              className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-gold active:scale-95 transition-transform shrink-0"
            >
              <Plus size={16} strokeWidth={2.75} />
              <span>{t('nav.newTx')}</span>
            </button>

            {/* Profile / Settings Drawer Trigger (Holds Theme, Tools, Admin & Safe Sign-Out) */}
            <button
              type="button"
              onClick={() => {
                haptic('light');
                onOpenSettings();
              }}
              className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] transition-colors flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
              title={t('nav.settings')}
              aria-label={t('nav.settings')}
            >
              <UserCircle size={18} className="sm:hidden" />
              <span className="hidden sm:inline font-mono">{initials}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Navbar = memo(NavbarComponent);
