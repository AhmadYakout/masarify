import React, { useState } from 'react';
import { TransactionType } from '../types';
import { CATEGORIES } from '../data/categories';
import { categorizeMerchant } from '../services/aiService';

interface AddTransactionProps {
  onAdd: (amount: number, merchant: string, category: string, type: TransactionType) => void;
  onCancel: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'sms'>('sms');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [type, setType] = useState<TransactionType>('expense');
  const [smsText, setSmsText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Advanced Parser for Egyptian Financial SMS
  const parseSms = (text: string) => {
    const cleanText = text.replace(/,/g, ''); // Remove commas from numbers

    const cibRegex = /Purchase of EGP\s*([\d.]+)\s*at\s*(.+?)\s*using/i;
    const nbeRegex = /for EGP\s*([\d.]+)\s*at\s*(.+?)(?:\.|$)/i;
    const instaRegex = /(?:Transfer of|Sent)\s*(?:EGP)?\s*([\d.]+)\s*(?:EGP)?\s*(?:to|for)\s*(.+?)(?:\.|$)/i;
    const walletRegex = /Payment of\s*([\d.]+)\s*EGP\s*to\s*(.+?)(?:\.|$)/i;
    const valuRegex = /paid\s*EGP\s*([\d.]+)\s*to\s*(.+?)(?:\.|$)/i;

    let match;
    let extractedAmount = '';
    let extractedMerchant = '';
    let extractedType: TransactionType = 'expense';

    if ((match = cleanText.match(cibRegex))) {
      extractedAmount = match[1];
      extractedMerchant = match[2];
    } else if ((match = cleanText.match(nbeRegex))) {
      extractedAmount = match[1];
      extractedMerchant = match[2];
    } else if ((match = cleanText.match(instaRegex))) {
      extractedAmount = match[1];
      extractedMerchant = `Transfer: ${match[2]}`;
      extractedType = 'expense';
    } else if ((match = cleanText.match(walletRegex))) {
      extractedAmount = match[1];
      extractedMerchant = match[2];
    } else if ((match = cleanText.match(valuRegex))) {
      extractedAmount = match[1];
      extractedMerchant = match[2];
      extractedType = 'installment';
    }

    if (extractedAmount && extractedMerchant) {
      return { 
        amount: extractedAmount, 
        merchant: extractedMerchant.trim(), 
        type: extractedType 
      };
    }
    return null;
  };

  const handleSmsPaste = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSmsText(text);
    
    const parsed = parseSms(text);
    if (parsed) {
      setAmount(parsed.amount);
      setMerchant(parsed.merchant);
      setType(parsed.type);
      
      // 1. Offline Parsing
      const lowerMerchant = parsed.merchant.toLowerCase();
      const foundCategory = CATEGORIES.find(c => 
        c.keywords.some(k => lowerMerchant.includes(k))
      );

      if (foundCategory) {
        setCategory(foundCategory.name);
        setActiveTab('manual');
      } else {
        // 2. AI Parsing Fallback
        setIsAiLoading(true);
        setActiveTab('manual');
        const aiCategory = await categorizeMerchant(parsed.merchant, parseFloat(parsed.amount));
        setCategory(aiCategory);
        setIsAiLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(parseFloat(amount), merchant, category, type);
  };

  return (
    <div className="bg-white min-h-screen p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Transaction</h2>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('sms')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sms' ? 'bg-white shadow text-cib-blue' : 'text-gray-500'}`}
        >
          Parse SMS
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow text-cib-blue' : 'text-gray-500'}`}
        >
          Manual Entry
        </button>
      </div>

      {activeTab === 'sms' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-bold">🚀 Smart Parser:</span> Supports CIB, NBE, InstaPay, Vodafone Cash, and Valu messages.
            </p>
          </div>
          <textarea
            value={smsText}
            onChange={handleSmsPaste}
            placeholder="Paste SMS here..."
            className="w-full h-32 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cib-blue focus:border-cib-blue transition-all"
          />
           <div className="text-xs text-gray-400">
             Try: "Purchase of EGP 150.00 at Bazooka..." or "Transfer of 500 to 012345..."
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-cib-blue outline-none py-2 placeholder-gray-300"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Title</label>
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
              placeholder="e.g., Carrefour, Uber"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
                {isAiLoading && <span className="ml-2 text-xs text-cib-blue animate-pulse">AI Checking...</span>}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="installment">Installment Payment</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-white font-bold bg-cib-blue rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddTransaction;