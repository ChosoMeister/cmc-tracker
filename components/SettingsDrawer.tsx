import React, { useEffect, useState } from 'react';
import {
  X,
  UserCircle,
  Palette,
  Moon,
  SunMedium,
  Laptop2,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Calculator,
  Download,
  Shield,
  RefreshCw,
  Layers,
  Languages,
} from 'lucide-react';
import * as AuthService from '../services/authService';
import { ConfirmDialog } from './ConfirmDialog';
import { useTranslation } from '../contexts/LanguageContext';

export type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  onDisplayNameChange: (name: string) => void;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onLogout: () => void;
  onOpenGoldBubble?: () => void;
  onOpenDcaCalculator?: () => void;
  onOpenExportImport?: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  onPriceUpdate?: () => void;
  isPriceUpdating?: boolean;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  displayName,
  username,
  onDisplayNameChange,
  theme,
  onThemeChange,
  onLogout,
  onOpenGoldBubble,
  onOpenDcaCalculator,
  onOpenExportImport,
  onOpenAdmin,
  isAdmin,
  onPriceUpdate,
  isPriceUpdating,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [nameValue, setNameValue] = useState(displayName);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({
    type: null,
    msg: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setNameValue(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) {
      setNewPass('');
      setConfirmPass('');
      setStatus({ type: null, msg: '' });
      setShowLogoutConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setStatus({
        type: 'error',
        msg: language === 'en' ? 'Passwords do not match' : 'تکرار رمز عبور مطابقت ندارد',
      });
      return;
    }

    try {
      setSavingPassword(true);
      await AuthService.updatePassword(username, newPass);
      setStatus({
        type: 'success',
        msg: language === 'en' ? 'Password updated successfully' : 'رمز عبور با موفقیت بروزرسانی شد',
      });
      setTimeout(() => {
        onClose();
        setStatus({ type: null, msg: '' });
        setNewPass('');
        setConfirmPass('');
      }, 1200);
    } catch (error: any) {
      setStatus({
        type: 'error',
        msg:
          error?.message ||
          (language === 'en' ? 'Error updating password' : 'خطا در بروزرسانی رمز عبور'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    onDisplayNameChange(nameValue.trim() || displayName);
    setStatus({
      type: 'success',
      msg: language === 'en' ? 'Display name saved' : 'نام نمایشی ذخیره شد',
    });
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        className="fixed inset-0 z-[120] flex justify-end"
      >
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm backdrop-enter"
          onClick={onClose}
        />
        <div
          className={`relative z-10 w-full sm:max-w-md h-full bg-[var(--card-bg)] text-[color:var(--text-primary)] border-s border-[color:var(--border-color)] shadow-2xl overflow-hidden flex flex-col ${
            language === 'en' ? 'drawer-enter-ltr' : 'drawer-enter-rtl'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-[color:var(--border-color)] flex items-center justify-between bg-[var(--muted-surface)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
                <UserCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[color:var(--text-muted)]">
                  {t('settings.accountSettings')}
                </p>
                <h2 className="text-base font-bold">{displayName || username}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-[var(--pill-bg)] flex items-center justify-center transition-colors"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-7">
            {/* Neutral Monochrome Quick Utilities */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[color:var(--text-muted)]">
                {language === 'en' ? 'Tools & Utilities' : 'ابزارهای کاربردی'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {onOpenGoldBubble && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGoldBubble();
                    }}
                    className="min-h-[44px] p-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center gap-2.5 text-start transition-colors"
                  >
                    <Calculator size={17} className="text-[var(--brand-primary)] shrink-0" />
                    <span className="text-xs font-bold">{t('market.bubbleCalc')}</span>
                  </button>
                )}
                {onOpenDcaCalculator && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDcaCalculator();
                    }}
                    className="min-h-[44px] p-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center gap-2.5 text-start transition-colors"
                  >
                    <Layers size={17} className="text-[var(--brand-primary)] shrink-0" />
                    <span className="text-xs font-bold">{t('common.dcaCalculator')}</span>
                  </button>
                )}
                {onOpenExportImport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExportImport();
                    }}
                    className="min-h-[44px] p-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center gap-2.5 text-start transition-colors"
                  >
                    <Download size={17} className="text-[var(--brand-primary)] shrink-0" />
                    <span className="text-xs font-bold">{t('common.exportImport')}</span>
                  </button>
                )}
                {onPriceUpdate && (
                  <button
                    type="button"
                    onClick={() => onPriceUpdate()}
                    disabled={isPriceUpdating}
                    className="min-h-[44px] p-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center gap-2.5 text-start transition-colors disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={`text-[var(--brand-primary)] shrink-0 ${
                        isPriceUpdating ? 'animate-spin' : ''
                      }`}
                    />
                    <span className="text-xs font-bold">{t('market.refreshPrices')}</span>
                  </button>
                )}
                {isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="col-span-2 min-h-[44px] p-3 rounded-xl bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] flex items-center gap-2.5 text-start transition-colors"
                  >
                    <Shield size={17} className="text-[var(--brand-primary)] shrink-0" />
                    <span className="text-xs font-bold">{t('common.adminPanel')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Language Selection (Zero Flag Emojis) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Languages size={17} className="text-[var(--brand-primary)]" />
                <h3 className="text-sm font-bold">{t('settings.language')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLanguage('fa')}
                  className={`min-h-[44px] flex items-center justify-center gap-2 border rounded-xl p-2.5 text-xs transition-colors ${
                    language === 'fa'
                      ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-primary)] font-bold'
                      : 'border-[color:var(--border-color)] bg-[var(--muted-surface)] text-[color:var(--text-primary)] font-semibold'
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-[var(--card-bg)] text-xs font-mono">FA</span>
                  <span>فارسی (RTL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[44px] flex items-center justify-center gap-2 border rounded-xl p-2.5 text-xs transition-colors ${
                    language === 'en'
                      ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-primary)] font-bold'
                      : 'border-[color:var(--border-color)] bg-[var(--muted-surface)] text-[color:var(--text-primary)] font-semibold'
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-[var(--card-bg)] text-xs font-mono">EN</span>
                  <span>English (LTR)</span>
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette size={17} className="text-[var(--brand-primary)]" />
                <h3 className="text-sm font-bold">{t('settings.theme')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light', label: t('settings.light'), icon: <SunMedium size={17} /> },
                  { key: 'dark', label: t('settings.dark'), icon: <Moon size={17} /> },
                  { key: 'system', label: t('settings.system'), icon: <Laptop2 size={17} /> },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onThemeChange(option.key as ThemeOption)}
                    className={`min-h-[54px] flex flex-col items-center justify-center gap-1.5 border rounded-xl p-2.5 text-center transition-colors ${
                      theme === option.key
                        ? 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-primary)] font-bold'
                        : 'border-[color:var(--border-color)] bg-[var(--muted-surface)] text-[color:var(--text-primary)] font-semibold'
                    }`}
                  >
                    <div>{option.icon}</div>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Name */}
            <form onSubmit={handleSaveDisplayName} className="space-y-2.5">
              <label className="text-xs font-bold text-[color:var(--text-muted)] block">
                {t('settings.displayName')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 min-h-[42px] rounded-xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-2 text-base sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                  placeholder={t('settings.displayName')}
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>

            {/* Security & Password */}
            <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2 border-t border-[color:var(--border-color)]">
              <div className="flex items-center gap-2">
                <Lock size={17} className="text-[var(--brand-primary)]" />
                <h3 className="text-sm font-bold">{t('settings.security')}</h3>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-muted)] block mb-1">
                    {t('settings.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-2 text-base sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                    placeholder={language === 'en' ? 'Minimum 6 characters' : 'حداقل ۶ کاراکتر'}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[color:var(--text-muted)] block mb-1">
                    {t('settings.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-3.5 py-2 text-base sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {status.type && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 border text-xs font-semibold ${
                    status.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{status.msg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full min-h-[44px] bg-[var(--muted-surface)] hover:bg-[var(--pill-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] font-bold rounded-xl text-xs transition-colors disabled:opacity-60"
              >
                {savingPassword ? t('settings.updatingPassword') : t('settings.updatePassword')}
              </button>
            </form>

            {/* Guarded Sign-Out */}
            <div className="pt-3 border-t border-[color:var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full min-h-[44px] border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <LogOut size={16} />
                <span>{t('settings.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={t('settings.logout')}
        message={
          language === 'en'
            ? 'Are you sure you want to sign out of your portfolio session?'
            : 'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟'
        }
        confirmLabel={t('settings.logout')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onClose();
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
