import { PaymentCandidate } from '../../types';
import { PERSISTENCE_KEYS, loadPersistedState, savePersistedState } from '../persistence';

export const loadPaymentCandidates = async (): Promise<PaymentCandidate[]> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.paymentCandidates);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(
    (entry): entry is PaymentCandidate =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as Partial<PaymentCandidate>).id === 'string' &&
      typeof (entry as Partial<PaymentCandidate>).rawMessage === 'string' &&
      typeof (entry as Partial<PaymentCandidate>).merchant === 'string' &&
      typeof (entry as Partial<PaymentCandidate>).detectedAt === 'string' &&
      typeof (entry as Partial<PaymentCandidate>).amount === 'number'
  );
};

export const savePaymentCandidates = async (candidates: PaymentCandidate[]): Promise<void> => {
  await savePersistedState(PERSISTENCE_KEYS.paymentCandidates, candidates);
};
