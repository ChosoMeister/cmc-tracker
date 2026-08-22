import { Transaction, PriceData, getAssetDetail } from '../types';

/**
 * ایجاد فایل و شروع دانلود در مرورگر
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * خروجی تراکنش‌ها به فرمت CSV سازگار با اکسل (با UTF-8 BOM برای نمایش صحیح حروف فارسی)
 */
export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const BOM = '\uFEFF';
  const headers = [
    'شناسه',
    'نماد دارایی',
    'نام دارایی',
    'تعداد / مقدار',
    'قیمت واحد خرید',
    'ارز خرید',
    'کارمزد (تومان)',
    'تاریخ خرید (میلادی)',
    'تاریخ خرید (شمسی)',
    'محل نگهداری / ولت',
    'برچسب‌ها',
    'یادداشت',
  ];

  const rows = transactions.map((t) => {
    const asset = getAssetDetail(t.assetSymbol);
    const dateObj = new Date(t.buyDateTime);
    const jalaliDate = dateObj.toLocaleDateString('fa-IR');
    const tagsString = (t.tags || []).join(' | ');

    return [
      `"${t.id}"`,
      `"${t.assetSymbol}"`,
      `"${asset.name}"`,
      t.quantity,
      t.buyPricePerUnit,
      `"${t.buyCurrency}"`,
      t.feesToman || 0,
      `"${t.buyDateTime}"`,
      `"${jalaliDate}"`,
      `"${t.wallet || ''}"`,
      `"${tagsString}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');
  const filename = `cmc_portfolio_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * پشتیبان‌گیری کامل از اطلاعات کاربر در فرمت JSON
 */
export const exportBackupJSON = (username: string, transactions: Transaction[], prices?: PriceData | null) => {
  const backupData = {
    app: 'CMC Tracker',
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    username,
    transactionCount: transactions.length,
    transactions,
    prices,
  };

  const jsonContent = JSON.stringify(backupData, null, 2);
  const filename = `cmc_backup_${username}_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
};

/**
 * اعتبارسنجی و خواندن فایل JSON بکاپ
 */
export const parseBackupJSON = (jsonString: string): { transactions: Transaction[]; username?: string } => {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.transactions) && !Array.isArray(data)) {
      throw new Error('فایل پشتیبان فاقد لیست تراکنش‌های معتبر است.');
    }

    const rawList = Array.isArray(data) ? data : data.transactions;
    const validatedTransactions: Transaction[] = rawList.map((item: any) => {
      if (!item.assetSymbol || typeof item.quantity !== 'number' || typeof item.buyPricePerUnit !== 'number') {
        throw new Error('ساختار یکی از تراکنش‌ها نامعتبر است.');
      }
      return {
        id: item.id || Math.random().toString(36).substr(2, 9),
        assetSymbol: String(item.assetSymbol).toUpperCase(),
        quantity: Number(item.quantity),
        buyPricePerUnit: Number(item.buyPricePerUnit),
        buyCurrency: item.buyCurrency === 'USD' ? 'USD' : 'TOMAN',
        buyDateTime: item.buyDateTime || new Date().toISOString(),
        feesToman: Number(item.feesToman) || 0,
        note: item.note ? String(item.note) : undefined,
        wallet: item.wallet ? String(item.wallet) : undefined,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
      };
    });

    return {
      transactions: validatedTransactions,
      username: data.username,
    };
  } catch (error: any) {
    throw new Error(`خطا در پردازش فایل JSON: ${error.message}`);
  }
};

/**
 * خواندن و پارس کردن فایل CSV
 */
export const parseTransactionsCSV = (csvString: string): Transaction[] => {
  try {
    const cleanStr = csvString.replace(/^\uFEFF/, ''); // حذف BOM
    const lines = cleanStr.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) throw new Error('فایل CSV خالی یا نامعتبر است');

    const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex برای جداسازی مقادیر دارای کاما در کوتیشن
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cols = matches.map((c) => c.replace(/^"|"$/g, '').trim());

      if (cols.length >= 5) {
        const symbol = (cols[1] || cols[0]).toUpperCase();
        const quantity = parseFloat(cols[3] || cols[2]) || 0;
        const price = parseFloat(cols[4] || cols[3]) || 0;
        const currency = (cols[5] || 'TOMAN').toUpperCase() === 'USD' ? 'USD' : 'TOMAN';
        const fees = parseFloat(cols[6]) || 0;
        const dateStr = cols[7] || new Date().toISOString();
        const wallet = cols[9] || undefined;
        const tags = cols[10] ? cols[10].split('|').map((t) => t.trim()).filter(Boolean) : undefined;
        const note = cols[11] || undefined;

        if (symbol && quantity > 0) {
          transactions.push({
            id: cols[0] && cols[0].length > 4 ? cols[0] : Math.random().toString(36).substr(2, 9),
            assetSymbol: symbol,
            quantity,
            buyPricePerUnit: price,
            buyCurrency: currency,
            buyDateTime: isNaN(Date.parse(dateStr)) ? new Date().toISOString() : new Date(dateStr).toISOString(),
            feesToman: fees,
            wallet,
            tags,
            note,
          });
        }
      }
    }

    if (transactions.length === 0) throw new Error('هیچ تراکنش معتبری در فایل CSV یافت نشد.');
    return transactions;
  } catch (err: any) {
    throw new Error(`خطا در خواندن فایل CSV: ${err.message}`);
  }
};
