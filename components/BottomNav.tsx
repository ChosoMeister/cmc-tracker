import React, { memo, useCallback } from 'react';
import { LayoutDashboard, PieChart, History, TrendingUp, Plus } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useTranslation } from '../contexts/LanguageContext';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewTx: () => void;
}

const BottomNavComponent: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenNewTx,
}) => {
  const { t } = useTranslation();
  const { haptic } = useHaptics();

  const handleTabChange = useCallback(
    (tabId: string) => {
      haptic('selection');
      onTabChange(tabId);
    },
    [haptic, onTabChange]
  );

  const renderTabButton = (
    id: string,
    label: string,
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  ) => {
    const isActive = currentTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleTabChange(id)}
        className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
          isActive
            ? 'text-[var(--brand-primary)] font-bold'
            : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] font-medium'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.9} />
        <span className="text-xs leading-none truncate max-w-[68px]">{label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] glass-strong border-t border-[color:var(--border-color)] px-2 pt-2 pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {renderTabButton('overview', t('nav.overview'), LayoutDashboard)}
        {renderTabButton('holdings', t('nav.holdings'), PieChart)}

        {/* Center Thumb-Zone Primary Action (>=44x44px) */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              haptic('success');
              onOpenNewTx();
            }}
            className="w-12 h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-gold active:scale-95 transition-transform flex items-center justify-center"
            title={t('nav.newTx')}
            aria-label={t('nav.newTx')}
          >
            <Plus size={22} strokeWidth={2.8} />
          </button>
        </div>

        {renderTabButton('market', t('nav.market'), TrendingUp)}
        {renderTabButton('transactions', t('nav.transactions'), History)}
      </div>
    </nav>
  );
};

export const BottomNav = memo(BottomNavComponent);
