export type TransactionType = 'expense' | 'income' | 'installment';
export type SmsDetectionSource = 'sms_inbox' | 'notification_listener' | 'manual_paste';
export type PaymentCandidateStatus = 'pending' | 'confirmed' | 'dismissed';
export type AppNotificationType = 'payment_candidate' | 'system';

export interface TransactionMetadata {
  parentCategoryId?: string;
  subCategoryId?: string;
  tagIds: string[];
  personId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string; // ISO string
  type: TransactionType;
  currency: 'EGP' | 'USD';
  originalSms?: string;
  parentCategoryId?: string;
  subCategoryId?: string;
  tagIds?: string[];
  personId?: string;
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

export interface PaymentCandidate {
  id: string;
  source: SmsDetectionSource;
  rawMessage: string;
  amount: number;
  merchant: string;
  category: string;
  type: TransactionType;
  detectedAt: string;
  status: PaymentCandidateStatus;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  candidateId?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_TRANSACTION = 'ADD_TRANSACTION',
  CATEGORIES = 'CATEGORIES',
  ANALYTICS = 'ANALYTICS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SETTINGS = 'SETTINGS',
  BILLS = 'BILLS'
}
