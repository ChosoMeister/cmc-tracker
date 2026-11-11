import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  ArrowDownToLine,
  RefreshCcw,
} from 'lucide-react';
import { Transaction, PriceData } from '../types';
import {
  exportTransactionsToCSV,
  exportBackupJSON,
  parseBackupJSON,
  parseTransactionsCSV,
} from '../utils/exportImport';
import { useToast } from './Toast';
import { useTranslation } from '../contexts/LanguageContext';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  username: string;
  prices: PriceData | null;
  onImportSuccess: (importedTransactions: Transaction[], mode: 'replace' | 'merge') => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  username,
  prices,
  onImportSuccess,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importPreview, setImportPreview] = useState<Transaction[] | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    try {
      if (transactions.length === 0) {
        addToast(
          language === 'en' ? 'No transactions to export' : 'تراکنشی برای خروجی اکسل وجود ندارد',
          'info'
        );
        return;
      }
      exportTransactionsToCSV(transactions);
      addToast(
        language === 'en'
          ? 'Excel (CSV) file downloaded successfully'
          : 'فایل اکسل (CSV) با موفقیت دانلود شد',
        'success'
      );
    } catch (error: any) {
      addToast(
        `${language === 'en' ? 'Error downloading file: ' : 'خطا در دانلود فایل: '}${error.message}`,
        'error'
      );
    }
  };

  const handleExportJSON = () => {
    try {
      exportBackupJSON(username, transactions, prices);
      addToast(
        language === 'en'
          ? 'JSON backup created successfully'
          : 'فایل پشتیبان JSON با موفقیت ایجاد شد',
        'success'
      );
    } catch (error: any) {
      addToast(
        `${language === 'en' ? 'Error creating backup: ' : 'خطا در ایجاد پشتیبان: '}${error.message}`,
        'error'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: Transaction[] = [];

        if (file.name.endsWith('.json')) {
          const res = parseBackupJSON(text);
          parsed = res.transactions;
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          parsed = parseTransactionsCSV(text);
        } else {
          throw new Error(
            language === 'en'
              ? 'Unsupported file format. Please select CSV or JSON.'
              : 'فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل CSV یا JSON انتخاب کنید.'
          );
        }

        setImportPreview(parsed);
        addToast(
          language === 'en'
            ? `${parsed.length} transactions ready for import`
            : `${parsed.length} تراکنش برای واردسازی آماده است`,
          'info'
        );
      } catch (err: any) {
        addToast(
          err.message || (language === 'en' ? 'Error reading file' : 'خطا در بارگذاری فایل'),
          'error'
        );
        setImportPreview(null);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setIsProcessing(true);
    try {
      await onImportSuccess(importPreview, importMode);
      addToast(
        importMode === 'replace'
          ? language === 'en'
            ? 'Portfolio replaced with new data'
            : 'پورتفوی با داده‌های جدید جایگزین شد'
          : language === 'en'
            ? 'New transactions added successfully'
            : 'تراکنش‌های جدید با موفقیت به پورتفوی اضافه شدند',
        'success'
      );
      setImportPreview(null);
      onClose();
    } catch (err: any) {
      addToast(
        `${language === 'en' ? 'Error importing data: ' : 'خطا در ثبت اطلاعات: '}${err.message}`,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('exportImport.title')}
      className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      <div className="relative z-10 bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full sm:max-w-lg max-h-[90vh] rounded-t-[20px] sm:rounded-[20px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] sheet-enter">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[var(--muted-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
              <ArrowDownToLine size={19} />
            </div>
            <div>
              <h2 className="font-bold text-base text-[color:var(--text-primary)]">
                {t('exportImport.title')}
              </h2>
              <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
                {t('exportImport.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl bg-[var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] border border-[color:var(--border-color)] flex items-center justify-center transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Selector */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('export');
                setImportPreview(null);
              }}
              className={`min-h-[40px] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              <Download size={14} />
              {t('exportImport.exportTab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`min-h-[40px] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              <Upload size={14} />
              {t('exportImport.importTab')}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[color:var(--text-primary)]">
                      {t('exportImport.excelCsv')}
                    </h4>
                    <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
                      {language === 'en'
                        ? 'Includes full transaction history and dates'
                        : 'شامل تاریخچه کامل تراکنش‌ها و تاریخ شمسی'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="min-h-[40px] px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors active:scale-95 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  {t('exportImport.downloadCsv')}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--muted-surface)] border border-[color:var(--border-color)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-border)] text-[var(--brand-primary)] flex items-center justify-center">
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[color:var(--text-primary)]">
                      {t('exportImport.fullJson')}
                    </h4>
                    <p className="text-xs text-[color:var(--text-muted)] font-medium mt-0.5">
                      {language === 'en'
                        ? 'Direct backup for transfer between devices/servers'
                        : 'برای انتقال مستقیم به دستگاه یا سرور دیگر'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="min-h-[40px] px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-bold text-xs transition-colors shadow-gold active:scale-95 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  {t('exportImport.downloadJson')}
                </button>
              </div>

              <div className="p-3.5 bg-[var(--brand-soft)] border border-[var(--brand-border)] rounded-xl text-xs text-[color:var(--text-primary)] font-semibold tabular-nums">
                {language === 'en'
                  ? 'Total transactions ready to export: '
                  : 'تعداد کل تراکنش‌های آماده خروجی: '}
                <span className="font-extrabold text-[var(--brand-primary)]">
                  {transactions.length}
                </span>{' '}
                {language === 'en' ? 'items' : 'مورد'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!importPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-[color:var(--border-color)] hover:border-[var(--brand-primary)] rounded-[20px] flex flex-col items-center justify-center gap-3 cursor-pointer bg-[var(--muted-surface)] transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-[color:var(--text-primary)]">
                      {language === 'en'
                        ? 'Click to choose backup file'
                        : 'برای انتخاب فایل بکاپ کلیک کنید'}
                    </div>
                    <div className="text-xs text-[color:var(--text-muted)] mt-1 font-medium">
                      {language === 'en' ? (
                        'Supports .csv and .json backup files'
                      ) : (
                        <>
                          پشتیبانی از فایل‌های <span className="font-mono">.csv</span> و{' '}
                          <span className="font-mono">.json</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 min-w-0">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span className="font-bold text-xs font-mono truncate">{fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreview(null);
                        setFileName('');
                      }}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
                    >
                      {language === 'en' ? 'Change File' : 'تغییر فایل'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[color:var(--text-muted)] block">
                      {language === 'en' ? 'Import Mode' : 'نحوه واردسازی داده‌ها'}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-colors text-start ${
                          importMode === 'merge'
                            ? 'bg-[var(--brand-soft)] border-[var(--brand-primary)] text-[var(--brand-primary)]'
                            : 'bg-[var(--card-bg)] border-[color:var(--border-color)] text-[color:var(--text-muted)]'
                        }`}
                      >
                        <div className="font-bold">{t('exportImport.mergeMode')}</div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {language === 'en'
                            ? 'Add to existing items'
                            : 'افزودن به تراکنش‌های موجود'}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-colors text-start ${
                          importMode === 'replace'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                            : 'bg-[var(--card-bg)] border-[color:var(--border-color)] text-[color:var(--text-muted)]'
                        }`}
                      >
                        <div className="font-bold">{t('exportImport.replaceMode')}</div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {language === 'en'
                            ? 'Wipe old & set new'
                            : 'حذف داده‌های قبلی و ثبت جدید'}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl text-xs flex justify-between items-center font-semibold tabular-nums">
                    <span>
                      {language === 'en'
                        ? 'Identified Transactions:'
                        : 'تعداد تراکنش‌های شناسایی‌شده:'}
                    </span>
                    <span className="font-extrabold text-[var(--brand-primary)]">
                      {importPreview.length} {language === 'en' ? 'items' : 'مورد'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isProcessing}
                    className="w-full min-h-[44px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl font-bold text-sm shadow-gold transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCcw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>{t('exportImport.confirmImport')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-[var(--muted-surface)] border-t border-[color:var(--border-color)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 rounded-xl bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] font-bold text-xs hover:bg-[var(--pill-bg)] transition-colors"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
