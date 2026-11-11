import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 shadow-rose',
    },
    warning: {
      icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      confirmBtn: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] shadow-gold',
    },
    info: {
      icon: 'bg-[var(--brand-soft)] text-[var(--brand-primary)]',
      confirmBtn: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] shadow-gold',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[180] flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
        onClick={onCancel}
      />

      <div className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-sm rounded-[20px] shadow-2xl overflow-hidden modal-enter border border-[color:var(--border-color)]">
        <div className="p-6 pb-4 flex flex-col items-center text-center">
          <div className={`w-13 h-13 p-3 rounded-xl flex items-center justify-center mb-4 ${styles.icon}`}>
            <AlertTriangle size={26} />
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-2">{title}</h3>
          <p className="text-[color:var(--text-muted)] text-xs sm:text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 pt-1 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl transition-colors active:scale-95"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-[44px] text-white font-bold text-xs sm:text-sm rounded-xl transition-colors active:scale-95 ${styles.confirmBtn}`}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
