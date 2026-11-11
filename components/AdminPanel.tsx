import React, { useEffect, useState } from 'react';
import { API } from '../services/api';
import {
  Users,
  Trash2,
  Key,
  ShieldCheck,
  X,
  Clock,
  BarChart,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import { useTranslation } from '../contexts/LanguageContext';
import { formatDateCached, formatNumber } from '../utils/formatting';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { language, t } = useTranslation();
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [offline, setOffline] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<string | null>(null);
  const [newPassValue, setNewPassValue] = useState('');

  const loadUsers = async () => {
    try {
      const { users: list, offline: isOff, message } = await API.getAllUsers();
      setUsers(list);
      setOffline(Boolean(isOff));
      setStatusMessage(message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await API.deleteUser(deleteTarget);
      addToast(
        language === 'en' ? `User @${deleteTarget} removed` : `کاربر @${deleteTarget} حذف شد`,
        'success'
      );
      setDeleteTarget(null);
      loadUsers();
    } catch (error: any) {
      addToast(
        error?.message || (language === 'en' ? 'Failed to delete user' : 'حذف کاربر انجام نشد'),
        'error'
      );
    }
  };

  const handleSavePassword = async (username: string) => {
    if (newPassValue.trim().length < 6) {
      addToast(
        language === 'en'
          ? 'Password must be at least 6 characters'
          : 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد',
        'error'
      );
      return;
    }
    try {
      await API.updateUserPassword(username, newPassValue.trim());
      addToast(
        language === 'en' ? 'Password updated successfully' : 'رمز عبور با موفقیت تغییر کرد',
        'success'
      );
      setPasswordTarget(null);
      setNewPassValue('');
    } catch (error: any) {
      addToast(
        error?.message ||
          (language === 'en' ? 'Password update failed' : 'تغییر رمز عبور انجام نشد'),
        'error'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('common.adminPanel')}
      className="fixed inset-0 z-[150] bg-[#090d16] text-slate-50 flex flex-col modal-enter"
    >
      <header className="bg-[#0f172a] border-b border-slate-800 px-5 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center justify-center text-amber-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base sm:text-lg">
              {language === 'en' ? 'System User Administration' : 'پنل مدیریت کاربران سیستم'}
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              {language === 'en'
                ? 'Registered accounts & server synchronization'
                : 'مدیریت حساب‌ها و وضعیت اتصال دیتابیس مرکزی'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] bg-slate-800/80 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {statusMessage && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <div className="space-y-0.5">
                  <p>{statusMessage}</p>
                  {offline && (
                    <p className="text-amber-300/80 text-xs">
                      {language === 'en'
                        ? 'Offline fallback active; reconnect to sync with central server.'
                        : 'حالت آفلاین فعال است؛ برای همگام‌سازی مجدد با سرور بررسی کنید.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {users.map((u) => (
                <div
                  key={u.username}
                  className="bg-[#0f172a] border border-slate-800 p-4 sm:p-5 rounded-[20px] space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          u.isAdmin
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Users size={19} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm truncate">
                            {u.displayName || u.username}
                          </span>
                          {u.isAdmin && (
                            <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-md">
                              {language === 'en' ? 'Admin' : 'مدیر'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">@{u.username}</div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap tabular-nums">
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                            <Clock size={12} />
                            <span>{formatDateCached(u.createdAt, language)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                            <BarChart size={12} />
                            <span>
                              {formatNumber(u.txCount || 0, 0, language)}{' '}
                              {language === 'en' ? 'trades' : 'تراکنش'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Always visible on touch & desktop (not hidden behind hover) */}
                    {!u.isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordTarget(passwordTarget === u.username ? null : u.username);
                            setNewPassValue('');
                          }}
                          className="min-w-[40px] min-h-[40px] px-3 bg-slate-800 text-slate-300 rounded-xl hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-700"
                          title={language === 'en' ? 'Reset Password' : 'تغییر رمز عبور'}
                        >
                          <Key size={15} />
                          <span className="hidden sm:inline">
                            {language === 'en' ? 'Password' : 'رمز عبور'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u.username)}
                          className="min-w-[40px] min-h-[40px] px-3 bg-rose-500/15 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold border border-rose-500/25"
                          title={language === 'en' ? 'Delete User' : 'حذف کاربر'}
                        >
                          <Trash2 size={15} />
                          <span className="hidden sm:inline">{t('common.delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Password Reset Form (replaces blocking window.prompt) */}
                  {passwordTarget === u.username && (
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="password"
                        value={newPassValue}
                        onChange={(e) => setNewPassValue(e.target.value)}
                        placeholder={
                          language === 'en'
                            ? `New password for @${u.username} (min 6 chars)`
                            : `رمز عبور جدید برای @${u.username} (حداقل ۶ کاراکتر)`
                        }
                        className="flex-1 min-h-[40px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                        dir="ltr"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSavePassword(u.username)}
                          className="min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{t('common.save')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPasswordTarget(null)}
                          className="min-h-[40px] px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={language === 'en' ? 'Delete User Account' : 'حذف حساب کاربری'}
        message={
          language === 'en'
            ? `Are you sure you want to permanently delete @${deleteTarget} and all their portfolio data?`
            : `آیا از حذف دائمی کاربر @${deleteTarget} و تمام داده‌های پورتفوی او اطمینان دارید؟`
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
