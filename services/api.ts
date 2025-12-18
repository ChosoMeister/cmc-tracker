
import { Transaction, PriceData, AssetSymbol } from '../types';

// این بخش در یک پروژه واقعی با فراخوانی‌های Fetch/Axios به سمت سرور (Node.js/Python) جایگزین می‌شود.
// در اینجا ما منطق دیتابیس فایل‌محور را شبیه‌سازی می‌کنیم.

interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
  transactions: Transaction[];
  isAdmin?: boolean;
}

// دیتابیس فرضی سرور (Global State Simulation)
let _serverUsers: UserRecord[] = JSON.parse(localStorage.getItem('__server_users') || '[]');
let _serverPrices: PriceData | null = JSON.parse(localStorage.getItem('__server_prices') || 'null');

// مقداردهی اولیه ادمین اگر وجود نداشته باشد
if (!_serverUsers.find(u => u.username === 'admin')) {
  _serverUsers.push({
    username: 'admin',
    passwordHash: 'orchidpharmed',
    createdAt: new Date().toISOString(),
    transactions: [],
    isAdmin: true
  });
}

const syncWithServer = () => {
  localStorage.setItem('__server_users', JSON.stringify(_serverUsers));
  localStorage.setItem('__server_prices', JSON.stringify(_serverPrices));
};

export const API = {
  // --- احراز هویت ---
  login: async (username: string, pass: string) => {
    const user = _serverUsers.find(u => u.username === username && u.passwordHash === pass);
    return user ? { username: user.username, isAdmin: !!user.isAdmin } : null;
  },

  register: async (username: string, pass: string) => {
    if (_serverUsers.find(u => u.username === username)) throw new Error('این نام کاربری قبلاً ثبت شده است');
    const newUser: UserRecord = {
      username,
      passwordHash: pass,
      createdAt: new Date().toISOString(),
      transactions: []
    };
    _serverUsers.push(newUser);
    syncWithServer();
    return { username: newUser.username, isAdmin: false };
  },

  // --- مدیریت کاربران (فقط ادمین) ---
  getAllUsers: async () => {
    return _serverUsers.map(u => ({
      username: u.username,
      createdAt: u.createdAt,
      txCount: u.transactions.length,
      isAdmin: !!u.isAdmin
    }));
  },

  deleteUser: async (username: string) => {
    if (username === 'admin') throw new Error('حذف ادمین امکان‌پذیر نیست');
    _serverUsers = _serverUsers.filter(u => u.username !== username);
    syncWithServer();
  },

  updateUserPassword: async (username: string, newPass: string) => {
    const user = _serverUsers.find(u => u.username === username);
    if (user) {
      user.passwordHash = newPass;
      syncWithServer();
    }
  },

  // --- تراکنش‌ها ---
  getTransactions: async (username: string) => {
    const user = _serverUsers.find(u => u.username === username);
    return user ? user.transactions : [];
  },

  saveTransaction: async (username: string, tx: Transaction) => {
    const user = _serverUsers.find(u => u.username === username);
    if (user) {
      const existingIdx = user.transactions.findIndex(t => t.id === tx.id);
      if (existingIdx > -1) user.transactions[existingIdx] = tx;
      else user.transactions.push(tx);
      syncWithServer();
    }
  },

  deleteTransaction: async (username: string, txId: string) => {
    const user = _serverUsers.find(u => u.username === username);
    if (user) {
      user.transactions = user.transactions.filter(t => t.id !== txId);
      syncWithServer();
    }
  },

  // --- قیمت‌ها (گلوبال) ---
  savePrices: async (prices: PriceData) => {
    _serverPrices = prices;
    syncWithServer();
  },

  getPrices: async () => {
    return _serverPrices;
  }
};
