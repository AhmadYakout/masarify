import { TransactionType } from '../../types';

export interface ParsedSmsTransaction {
  amount: string;
  merchant: string;
  type: TransactionType;
}

export const parseEgyptianFinanceSms = (text: string): ParsedSmsTransaction | null => {
  const cleanText = text.replace(/,/g, '');
  const patterns: Array<{
    regex: RegExp;
    map: (match: RegExpMatchArray) => ParsedSmsTransaction;
  }> = [
    {
      regex: /Purchase of EGP\s*([\d.]+)\s*at\s*(.+?)\s*using/i,
      map: (match) => ({
        amount: match[1],
        merchant: match[2].trim(),
        type: 'expense',
      }),
    },
    {
      regex: /for EGP\s*([\d.]+)\s*at\s*(.+?)(?:\.|$)/i,
      map: (match) => ({
        amount: match[1],
        merchant: match[2].trim(),
        type: 'expense',
      }),
    },
    {
      regex: /(?:Transfer of|Sent)\s*(?:EGP)?\s*([\d.]+)\s*(?:EGP)?\s*(?:to|for)\s*(.+?)(?:\.|$)/i,
      map: (match) => ({
        amount: match[1],
        merchant: `Transfer: ${match[2].trim()}`,
        type: 'expense',
      }),
    },
    {
      regex: /Payment of\s*([\d.]+)\s*EGP\s*to\s*(.+?)(?:\.|$)/i,
      map: (match) => ({
        amount: match[1],
        merchant: match[2].trim(),
        type: 'expense',
      }),
    },
    {
      regex: /paid\s*EGP\s*([\d.]+)\s*to\s*(.+?)(?:\.|$)/i,
      map: (match) => ({
        amount: match[1],
        merchant: match[2].trim(),
        type: 'installment',
      }),
    },
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern.regex);
    if (match) {
      return pattern.map(match);
    }
  }

  return null;
};
