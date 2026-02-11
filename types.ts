export type TransactionType = 'expense' | 'income' | 'installment';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string; // ISO string
  type: TransactionType;
  currency: 'EGP' | 'USD';
  originalSms?: string;
}

export interface AssetRates {
  usdToEgp: number;
  gold21k: number; // Price per gram in EGP
  lastUpdated: string;
}

export interface UserGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  colorHex?: string; 
  emoji?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  dueDate: number; // Day of the month (1-31)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_TRANSACTION = 'ADD_TRANSACTION',
  ANALYTICS = 'ANALYTICS',
  BILLS = 'BILLS',
  COACH = 'COACH'
}