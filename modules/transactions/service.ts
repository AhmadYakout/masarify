import { RecurringBill, Transaction, TransactionMetadata, TransactionType } from '../../types';
import { validateTransactionMetadata } from '../categories/service';
import { CategoryState } from '../categories/storage';

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const nowIso = (): string => new Date().toISOString();

export interface ManualTransactionInput {
  amount: number;
  merchant: string;
  category: string;
  type: TransactionType;
  metadata: TransactionMetadata;
}

export type ManualTransactionBuildResult =
  | {
      isValid: true;
      transaction: Transaction;
    }
  | {
      isValid: false;
      error: string;
    };

export const calculateTotalBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((acc, transaction) => {
    return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
  }, 0);
};

export const buildManualTransaction = (
  categoryState: CategoryState,
  input: ManualTransactionInput
): ManualTransactionBuildResult => {
  const validation = validateTransactionMetadata(categoryState, input.metadata);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.issues[0] || 'Invalid category metadata.',
    };
  }

  return {
    isValid: true,
    transaction: {
      id: createId('manual'),
      amount: input.amount,
      merchant: input.merchant,
      category: input.category,
      type: input.type,
      date: nowIso(),
      currency: 'EGP',
      parentCategoryId: input.metadata.parentCategoryId,
      subCategoryId: input.metadata.subCategoryId,
      tagIds: input.metadata.tagIds,
      personId: input.metadata.personId,
    },
  };
};

export const prependTransaction = (
  transactions: Transaction[],
  transaction: Transaction
): Transaction[] => {
  return [transaction, ...transactions];
};

export const addRecurringBill = (bills: RecurringBill[], bill: RecurringBill): RecurringBill[] => {
  return [...bills, bill];
};

export const toggleRecurringBill = (bills: RecurringBill[], billId: string): RecurringBill[] => {
  return bills.map((bill) => (bill.id === billId ? { ...bill, isPaid: !bill.isPaid } : bill));
};

export const deleteRecurringBill = (bills: RecurringBill[], billId: string): RecurringBill[] => {
  return bills.filter((bill) => bill.id !== billId);
};

export const detachTagFromTransactions = (
  transactions: Transaction[],
  tagId: string
): Transaction[] => {
  return transactions.map((transaction) => ({
    ...transaction,
    tagIds: (transaction.tagIds || []).filter((transactionTagId) => transactionTagId !== tagId),
  }));
};

export const detachPersonFromTransactions = (
  transactions: Transaction[],
  personId: string
): Transaction[] => {
  return transactions.map((transaction) =>
    transaction.personId === personId
      ? {
          ...transaction,
          personId: undefined,
        }
      : transaction
  );
};
