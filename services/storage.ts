import { Transaction } from '../types';

const STORAGE_KEY = 'gemini_portfolio_transactions';

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load transactions', e);
    return [];
  }
};

export const saveTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  const updated = [...current, transaction];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
