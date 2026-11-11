import React from 'react';
import { PackageOpen, Wallet, History, PieChart, Plus } from 'lucide-react';

type EmptyStateType = 'holdings' | 'transactions' | 'chart' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const iconMap: Record<
  EmptyStateType,
  React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
  holdings: Wallet,
  transactions: History,
  chart: PieChart,
  default: PackageOpen,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const Icon = iconMap[type];

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-in">
      <div className="w-16 h-16 rounded-[20px] bg-[var(--brand-soft)] border border-[var(--brand-border)] flex items-center justify-center mb-5">
        <Icon size={30} strokeWidth={1.75} className="text-[var(--brand-primary)]" />
      </div>

      <h3 className="text-[color:var(--text-primary)] font-bold text-lg mb-2">
        {title}
      </h3>

      <p className="text-[color:var(--text-muted)] text-sm max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 min-h-[44px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-gold active:scale-95 transition-transform"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
