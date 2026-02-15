import { Transaction } from '../../types';
import { detachPersonFromTransactions, detachTagFromTransactions } from '../transactions';
import { deleteTag, setPersonActive } from './service';
import { CategoryState } from './storage';

export interface TagDeletionResult {
  categoryState: CategoryState;
  transactions: Transaction[];
}

export const deleteTagWithCleanup = (
  categoryState: CategoryState,
  transactions: Transaction[],
  tagId: string
): TagDeletionResult => {
  return {
    categoryState: deleteTag(categoryState, tagId),
    transactions: detachTagFromTransactions(transactions, tagId),
  };
};

export interface PersonActivationResult {
  categoryState: CategoryState;
  transactions: Transaction[];
}

export const setPersonActiveWithCleanup = (
  categoryState: CategoryState,
  transactions: Transaction[],
  personId: string,
  isActive: boolean
): PersonActivationResult => {
  return {
    categoryState: setPersonActive(categoryState, personId, isActive),
    transactions: isActive ? transactions : detachPersonFromTransactions(transactions, personId),
  };
};
