import { matchCategoryFromMerchant } from '../categories';
import { parseEgyptianFinanceSms } from './parseEgyptianFinanceSms';
import { PaymentCandidate, SmsDetectionSource } from '../../types';

const createCandidateId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const detectPaymentCandidate = (
  rawMessage: string,
  source: SmsDetectionSource = 'manual_paste'
): PaymentCandidate | null => {
  const parsed = parseEgyptianFinanceSms(rawMessage);
  if (!parsed) {
    return null;
  }

  return {
    id: createCandidateId(),
    source,
    rawMessage,
    amount: Number(parsed.amount),
    merchant: parsed.merchant,
    category: matchCategoryFromMerchant(parsed.merchant),
    type: parsed.type,
    detectedAt: new Date().toISOString(),
    status: 'pending',
  };
};
