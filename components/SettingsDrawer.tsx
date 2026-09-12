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
  Sparkles,
  Layers
} from 'lucide-react';
import * as AuthService from '../services/authService';

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
  isPriceUpdating
}) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [nameValue, setNameValue] = useState(displayName);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setNameValue(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) {
      setNewPass('');
      setConfirmPass('');
      setStatus({ type: null, msg: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setStatus({ type: 'error', msg: 'تکرار رمز عبور مطابقت ندارد' });
      return;
    }

    try {
      setSavingPassword(true);
      await AuthService.updatePassword(username, newPass);
      setStatus({ type: 'success', msg: 'رمز عبور با موفقیت بروزرسانی شد' });
      setTimeout(() => {
        onClose();
        setStatus({ type: null, msg: '' });
        setNewPass('');
        setConfirmPass('');
      }, 1200);
    } catch (error: any) {
      setStatus({ type: 'error', msg: error?.message || 'خطا در بروزرسانی رمز عبور' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    onDisplayNameChange(nameValue.trim() || displayName);
    setStatus({ type: 'success', msg: 'نام نمایشی ذخیره شد' });
  };

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-[var(--app-bg)] text-[color:var(--text-primary)] shadow-2xl rounded-l-[24px] sm:rounded-l-[32px] overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className="p-6 border-b border-[color:var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--app-bg)] z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UserCircle size={22} />
              </div>
              <div>
                <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">تنظیمات حساب</p>
                <h2 className="text-lg font-black">{displayName || username}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[color:var(--muted-surface)] transition-colors" aria-label="بستن تنظیمات">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Quick Tools for Mobile */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">ابزارهای کاربردی</p>
              <div className="grid grid-cols-2 gap-2.5">
                {onOpenGoldBubble && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenGoldBubble(); }}
                    className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-2.5 text-right transition-all"
                  >
                    <Calculator size={18} className="text-amber-500 shrink-0" />
                    <span className="text-xs font-black">حباب طلا و سکه</span>
                  </button>
                )}
                {onOpenDcaCalculator && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenDcaCalculator(); }}
                    className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center gap-2.5 text-right transition-all"
                  >
                    <Layers size={18} className="text-indigo-500 shrink-0" />
                    <span className="text-xs font-black">میانگین‌کم‌کنی DCA</span>
                  </button>
                )}
                {onOpenExportImport && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenExportImport(); }}
                    className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-right transition-all"
                  >
                    <Download size={18} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-black">خروجی و ورودی</span>
                  </button>
                )}
                {onPriceUpdate && (
                  <button
                    type="button"
                    onClick={() => { onPriceUpdate(); }}
                    disabled={isPriceUpdating}
                    className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-2.5 text-right transition-all"
                  >
                    <RefreshCw size={18} className={`text-blue-500 shrink-0 ${isPriceUpdating ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-black">بروزرسانی قیمت</span>
                  </button>
                )}
                {isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenAdmin(); }}
                    className="p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-2.5 text-right transition-all"
                  >
                    <Shield size={18} className="text-purple-500 shrink-0" />
                    <span className="text-xs font-black">پنل ادمین</span>
                  </button>
                )}
              </div>
            </div>

            {/* Display Name Edit */}
            <form onSubmit={handleSaveDisplayName} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">نام نمایشی</p>
                  <h3 className="text-base font-black">اطلاعات حساب</h3>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[color:var(--text-muted)] px-1">نامی که در هدر نمایش داده می‌شود</label>
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="نام نمایشی"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs"
                >
                  ذخیره نام
                </button>
              </div>
            </form>

            {/* Theme Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">گزینه‌های تم</p>
                  <h3 className="text-base font-black">تجربه بصری</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light', label: 'روشن', icon: <SunMedium size={18} /> },
                  { key: 'dark', label: 'تاریک', icon: <Moon size={18} /> },
                  { key: 'system', label: 'سیستم', icon: <Laptop2 size={18} /> },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onThemeChange(option.key as ThemeOption)}
                    className={`flex flex-col items-center justify-center gap-2 border rounded-2xl p-3 text-center transition-all ${
                      theme === option.key
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-[color:var(--border-color)] bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                    }`}
                  >
                    <div className="text-blue-500">
                      {option.icon}
                    </div>
                    <p className="text-xs font-black">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Password Update */}
            <form onSubmit={handleUpdatePassword} className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">تغییر گذرواژه</p>
                  <h3 className="text-base font-black">امنیت حساب</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[color:var(--text-muted)] px-1">گذرواژه جدید</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="حداقل ۶ کاراکتر"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[color:var(--text-muted)] px-1">تأیید گذرواژه جدید</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {status.type && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    status.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="text-xs font-bold">{status.msg}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'در حال ذخیره...' : 'به‌روزرسانی گذرواژه'}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <LogOut size={16} />
                  خروج از حساب کاربری
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
