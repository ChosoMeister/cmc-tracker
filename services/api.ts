
import { Transaction, PriceData } from '../types';

const BASE_URL = ''; // چون سرور فایل‌های استاتیک را سرو می‌کند، آدرس پایه خالی است

export const API = {
  login: async (username: string, pass: string) => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass })
    });
    if (!res.ok) return null;
    return res.json();
  },

  register: async (username: string, pass: string) => {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'ثبت‌نام ناموفق بود');
    }
    return res.json();
  },

  getAllUsers: async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    return res.json();
  },

  deleteUser: async (username: string) => {
    await fetch(`${BASE_URL}/api/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  },

  updateUserPassword: async (username: string, newPass: string) => {
    await fetch(`${BASE_URL}/api/users/update-pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword: newPass })
    });
  },

  getTransactions: async (username: string) => {
    const res = await fetch(`${BASE_URL}/api/transactions?username=${username}`);
    return res.json();
  },

  saveTransaction: async (username: string, tx: Transaction) => {
    await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, transaction: tx })
    });
  },

  deleteTransaction: async (username: string, txId: string) => {
    await fetch(`${BASE_URL}/api/transactions/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, txId })
    });
  },

  savePrices: async (prices: PriceData) => {
    await fetch(`${BASE_URL}/api/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prices)
    });
  },

  getPrices: async () => {
    const res = await fetch(`${BASE_URL}/api/prices`);
    return res.json();
  }
};
