import { AppNotification, PaymentCandidate, SmsDetectionSource, Transaction } from '../../types';
import { buildCandidateDetectedNotification, buildSystemNotification } from '../notifications';
import { prependTransaction } from '../transactions';
import { detectPaymentCandidate } from './detection';

export interface DetectionWorkflowResult {
  accepted: boolean;
  candidates: PaymentCandidate[];
  notifications: AppNotification[];
  pushNotification?: AppNotification;
}

const createCandidateTransaction = (candidate: PaymentCandidate): Transaction => {
  return {
    id: `candidate-${candidate.id}`,
    amount: candidate.amount,
    merchant: candidate.merchant,
    category: candidate.category,
    type: candidate.type,
    date: new Date().toISOString(),
    currency: 'EGP',
    originalSms: candidate.rawMessage,
  };
};

const markCandidateStatus = (
  candidates: PaymentCandidate[],
  candidateId: string,
  status: PaymentCandidate['status']
): PaymentCandidate[] => {
  return candidates.map((candidate) =>
    candidate.id === candidateId ? { ...candidate, status } : candidate
  );
};

export const queueDetectedCandidate = (
  candidates: PaymentCandidate[],
  notifications: AppNotification[],
  rawMessage: string,
  source: SmsDetectionSource
): DetectionWorkflowResult => {
  const candidate = detectPaymentCandidate(rawMessage, source);
  if (!candidate) {
    return { accepted: false, candidates, notifications };
  }

  const duplicatePending = candidates.some(
    (existing) => existing.rawMessage === candidate.rawMessage && existing.status === 'pending'
  );
  if (duplicatePending) {
    return { accepted: false, candidates, notifications };
  }

  const detectionNotification = buildCandidateDetectedNotification(candidate);
  return {
    accepted: true,
    candidates: [candidate, ...candidates],
    notifications: [detectionNotification, ...notifications],
    pushNotification: detectionNotification,
  };
};

export interface ConfirmCandidateResult {
  changed: boolean;
  candidates: PaymentCandidate[];
  transactions: Transaction[];
  notifications: AppNotification[];
  pushNotification?: AppNotification;
}

export const confirmCandidate = (
  candidates: PaymentCandidate[],
  transactions: Transaction[],
  notifications: AppNotification[],
  candidateId: string
): ConfirmCandidateResult => {
  const targetCandidate = candidates.find(
    (candidate) => candidate.id === candidateId && candidate.status === 'pending'
  );
  if (!targetCandidate) {
    return { changed: false, candidates, transactions, notifications };
  }

  const updatedCandidates = markCandidateStatus(candidates, candidateId, 'confirmed');
  const transactionId = `candidate-${targetCandidate.id}`;
  const alreadyInserted = transactions.some((transaction) => transaction.id === transactionId);
  const updatedTransactions = alreadyInserted
    ? transactions
    : prependTransaction(transactions, createCandidateTransaction(targetCandidate));

  const confirmationNotification = buildSystemNotification(
    'Payment confirmed',
    `${targetCandidate.merchant} transaction was added successfully.`,
    targetCandidate.id
  );

  return {
    changed: true,
    candidates: updatedCandidates,
    transactions: updatedTransactions,
    notifications: [confirmationNotification, ...notifications],
    pushNotification: confirmationNotification,
  };
};

export interface DismissCandidateResult {
  changed: boolean;
  candidates: PaymentCandidate[];
  notifications: AppNotification[];
}

export const dismissCandidate = (
  candidates: PaymentCandidate[],
  notifications: AppNotification[],
  candidateId: string
): DismissCandidateResult => {
  const targetCandidate = candidates.find(
    (candidate) => candidate.id === candidateId && candidate.status === 'pending'
  );
  if (!targetCandidate) {
    return { changed: false, candidates, notifications };
  }

  const updatedCandidates = markCandidateStatus(candidates, candidateId, 'dismissed');
  const dismissalNotification = buildSystemNotification(
    'Payment dismissed',
    `${targetCandidate.merchant} was dismissed from pending confirmations.`,
    targetCandidate.id
  );

  return {
    changed: true,
    candidates: updatedCandidates,
    notifications: [dismissalNotification, ...notifications],
  };
};
