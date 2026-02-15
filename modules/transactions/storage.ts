import { RecurringBill, Transaction } from '../../types';
import { PERSISTENCE_KEYS, loadPersistedState, savePersistedState } from '../persistence';

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 450,
    merchant: 'Vodafone Bill',
    category: 'Bills',
    date: new Date().toISOString(),
    type: 'expense',
    currency: 'EGP',
  },
  {
    id: '2',
    amount: 15000,
    merchant: 'Freelance Work',
    category: 'Salary',
    date: new Date().toISOString(),
    type: 'income',
    currency: 'EGP',
  },
];

export const DEFAULT_BILLS: RecurringBill[] = [
  { id: '1', name: 'Home Rent', amount: 4000, isPaid: false, dueDate: 1 },
  { id: '2', name: 'Car Installment', amount: 2500, isPaid: true, dueDate: 15 },
  { id: '3', name: 'Netflix', amount: 200, isPaid: false, dueDate: 28 },
];

const sanitizeTransactions = (value: unknown): Transaction[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter(
    (entry): entry is Transaction =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as Partial<Transaction>).id === 'string' &&
      typeof (entry as Partial<Transaction>).merchant === 'string' &&
      typeof (entry as Partial<Transaction>).category === 'string' &&
      typeof (entry as Partial<Transaction>).date === 'string' &&
      typeof (entry as Partial<Transaction>).amount === 'number'
  );
};

const sanitizeBills = (value: unknown): RecurringBill[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter(
    (entry): entry is RecurringBill =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as Partial<RecurringBill>).id === 'string' &&
      typeof (entry as Partial<RecurringBill>).name === 'string' &&
      typeof (entry as Partial<RecurringBill>).amount === 'number' &&
      typeof (entry as Partial<RecurringBill>).isPaid === 'boolean' &&
      typeof (entry as Partial<RecurringBill>).dueDate === 'number'
  );
};

export const loadTransactions = async (): Promise<Transaction[]> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.transactions);
  const parsed = sanitizeTransactions(stored);
  if (!parsed) {
    return DEFAULT_TRANSACTIONS;
  }
  return parsed;
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  await savePersistedState(PERSISTENCE_KEYS.transactions, transactions);
};

export const loadBills = async (): Promise<RecurringBill[]> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.bills);
  const parsed = sanitizeBills(stored);
  if (!parsed) {
    return DEFAULT_BILLS;
  }
  return parsed;
};

export const saveBills = async (bills: RecurringBill[]): Promise<void> => {
  await savePersistedState(PERSISTENCE_KEYS.bills, bills);
};
