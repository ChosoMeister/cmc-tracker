import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, FileJson, CheckCircle2, AlertTriangle, ArrowDownToLine, RefreshCcw } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleExportCSV = () => {
    try {
      if (transactions.length === 0) {
        addToast(language === 'en' ? 'No transactions to export' : 'تراکنشی برای خروجی اکسل وجود ندارد', 'info');
        return;
      }
      exportTransactionsToCSV(transactions);
      addToast(language === 'en' ? 'Excel (CSV) file downloaded successfully' : 'فایل اکسل (CSV) با موفقیت دانلود شد', 'success');
    } catch (error: any) {
      addToast(`${language === 'en' ? 'Error downloading file: ' : 'خطا در دانلود فایل: '}${error.message}`, 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      exportBackupJSON(username, transactions, prices);
      addToast(language === 'en' ? 'JSON backup created successfully' : 'فایل پشتیبان JSON با موفقیت ایجاد شد', 'success');
    } catch (error: any) {
      addToast(`${language === 'en' ? 'Error creating backup: ' : 'خطا در ایجاد پشتیبان: '}${error.message}`, 'error');
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
          throw new Error(language === 'en' ? 'Unsupported file format. Please select CSV or JSON.' : 'فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل CSV یا JSON انتخاب کنید.');
        }

        setImportPreview(parsed);
        addToast(language === 'en' ? `${parsed.length} transactions ready for import` : `${parsed.length} تراکنش برای واردسازی آماده است`, 'info');
      } catch (err: any) {
        addToast(err.message || (language === 'en' ? 'Error reading file' : 'خطا در بارگذاری فایل'), 'error');
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
          ? (language === 'en' ? 'Portfolio replaced with new data' : 'پورتفوی با داده‌های جدید جایگزین شد')
          : (language === 'en' ? 'New transactions added successfully' : 'تراکنش‌های جدید با موفقیت به پورتفوی اضافه شدند'),
        'success'
      );
      setImportPreview(null);
      onClose();
    } catch (err: any) {
      addToast(`${language === 'en' ? 'Error importing data: ' : 'خطا در ثبت اطلاعات: '}${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-lg max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-[color:var(--border-color)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-6 py-5 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[color:var(--muted-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <ArrowDownToLine size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg text-[color:var(--text-primary)]">
                {t('exportImport.title')}
              </h2>
              <p className="text-[11px] text-[color:var(--text-muted)] font-bold">
                {t('exportImport.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-[color:var(--card-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] border border-[color:var(--border-color)] transition-all"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Selector */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => { setActiveTab('export'); setImportPreview(null); }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[color:var(--muted-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
            }`}
          >
            <Download size={14} />
            {t('exportImport.exportTab')}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[color:var(--muted-surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
            }`}
          >
            <Upload size={14} />
            {t('exportImport.importTab')}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[color:var(--text-primary)]">{t('exportImport.excelCsv')}</h4>
                    <p className="text-[11px] text-[color:var(--text-muted)] font-bold">
                      {language === 'en' ? 'Includes full transaction history and dates' : 'شامل تاریخچه کامل تراکنش‌ها و تاریخ شمسی'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  {t('exportImport.downloadCsv')}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <FileJson size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[color:var(--text-primary)]">{t('exportImport.fullJson')}</h4>
                    <p className="text-[11px] text-[color:var(--text-muted)] font-bold">
                      {language === 'en' ? 'Direct backup for transfer between devices/servers' : 'برای انتقال مستقیم به دستگاه یا سرور دیگر'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Download size={14} />
                  {t('exportImport.downloadJson')}
                </button>
              </div>

              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                {language === 'en' ? 'Total transactions ready to export: ' : 'تعداد کل تراکنش‌های آماده خروجی: '}<span className="font-black font-mono">{transactions.length}</span> {language === 'en' ? 'items' : 'مورد'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!importPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-[color:var(--border-color)] hover:border-blue-500/60 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-[color:var(--muted-surface)] transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-sm text-[color:var(--text-primary)]">
                      {language === 'en' ? 'Click or drop file here' : 'کلیک کنید یا فایل را اینجا بکشید'}
                    </div>
                    <div className="text-[11px] text-[color:var(--text-muted)] mt-1 font-bold">
                      {language === 'en' ? 'Supports .csv and .json backup files' : <>پشتیبانی از فایل‌های <span className="font-mono">.csv</span> و <span className="font-mono">.json</span></>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={18} />
                      <span className="font-black text-xs font-mono">{fileName}</span>
                    </div>
                    <button
                      onClick={() => { setImportPreview(null); setFileName(''); }}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      {language === 'en' ? 'Change File' : 'تغییر فایل'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[color:var(--text-muted)] block">
                      {language === 'en' ? 'Import Mode' : 'نحوه واردسازی داده‌ها'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-right ${
                          importMode === 'merge'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'bg-[color:var(--card-bg)] border-[color:var(--border-color)] text-[color:var(--text-muted)]'
                        }`}
                      >
                        <div className="font-black">{t('exportImport.mergeMode')}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{language === 'en' ? 'Add to existing items' : 'افزودن به تراکنش‌های موجود'}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-right ${
                          importMode === 'replace'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                            : 'bg-[color:var(--card-bg)] border-[color:var(--border-color)] text-[color:var(--text-muted)]'
                        }`}
                      >
                        <div className="font-black">{t('exportImport.replaceMode')}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{language === 'en' ? 'Wipe old & set new' : 'حذف داده‌های قبلی و ثبت جدید'}</div>
                      </button>
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="p-3 bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-xl text-xs flex justify-between items-center font-bold">
                    <span>{language === 'en' ? 'Identified Transactions:' : 'تعداد تراکنش‌های شناسایی‌شده:'}</span>
                    <span className="font-black font-mono text-blue-600">{importPreview.length} {language === 'en' ? 'items' : 'مورد'}</span>
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={isProcessing}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
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
        <footer className="p-4 bg-[color:var(--muted-surface)] border-t border-[color:var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[color:var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] font-bold text-xs hover:opacity-80 transition-all"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};
