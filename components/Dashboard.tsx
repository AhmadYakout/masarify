import React from 'react';
import { Transaction } from '../types';
import { getCategoryByName } from '../data/categories';

interface DashboardProps {
  transactions: Transaction[];
  totalBalance: number;
  onOpenSettings: () => void;
  onOpenCategories: () => void;
  onAddTransaction: () => void;
  onOpenNotifications: () => void;
  onOpenBills: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  totalBalance,
  onOpenSettings,
  onOpenCategories,
  onAddTransaction,
  onOpenNotifications,
  onOpenBills,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  // Group transactions by Date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  transactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString();
    if (!groupedTransactions[date]) groupedTransactions[date] = [];
    groupedTransactions[date].push(t);
  });

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header / Balance Card */}
      <div className="bg-gradient-to-br from-cib-blue to-blue-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm font-medium">Safe to Spend</p>
            <h1 className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</h1>
          </div>
          <button
            onClick={onOpenSettings}
            className="bg-white/20 p-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
            aria-label="Open Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.983 5.5a1.5 1.5 0 011.41.99l.2.54a1.5 1.5 0 001.31.97l.58.06a1.5 1.5 0 011.19 2.1l-.24.53a1.5 1.5 0 00.24 1.58l.4.43a1.5 1.5 0 010 2.08l-.4.43a1.5 1.5 0 00-.24 1.58l.24.53a1.5 1.5 0 01-1.19 2.1l-.58.06a1.5 1.5 0 00-1.31.97l-.2.54a1.5 1.5 0 01-2.82 0l-.2-.54a1.5 1.5 0 00-1.31-.97l-.58-.06a1.5 1.5 0 01-1.19-2.1l.24-.53a1.5 1.5 0 00-.24-1.58l-.4-.43a1.5 1.5 0 010-2.08l.4-.43a1.5 1.5 0 00.24-1.58l-.24-.53a1.5 1.5 0 011.19-2.1l.58-.06a1.5 1.5 0 001.31-.97l.2-.54a1.5 1.5 0 011.41-.99z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </button>
        </div>
        <div className="mt-6 flex space-x-4">
          <div className="bg-black/20 rounded-lg p-2 flex-1 text-center">
            <p className="text-xs text-blue-200">Income</p>
            <p className="font-semibold text-sm text-green-300">
              {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-2 flex-1 text-center">
            <p className="text-xs text-blue-200">Expenses</p>
            <p className="font-semibold text-sm text-red-300">
              {formatCurrency(transactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
          <button
            onClick={onOpenCategories}
            className="text-xs font-semibold text-cib-blue hover:underline"
          >
            Manage categories
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAddTransaction}
            className="text-left rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-cib-blue/30"
          >
            <p className="text-sm font-semibold text-gray-900">Add Transaction</p>
            <p className="text-xs text-gray-500 mt-1">Manual entry or SMS parse</p>
          </button>
          <button
            onClick={onOpenNotifications}
            className="text-left rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-cib-blue/30"
          >
            <p className="text-sm font-semibold text-gray-900">Review Alerts</p>
            <p className="text-xs text-gray-500 mt-1">Confirm detected payments</p>
          </button>
          <button
            onClick={onOpenBills}
            className="text-left rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-cib-blue/30"
          >
            <p className="text-sm font-semibold text-gray-900">Monthly Bills</p>
            <p className="text-xs text-gray-500 mt-1">Track due and paid bills</p>
          </button>
          <button
            onClick={onOpenCategories}
            className="text-left rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-cib-blue/30"
          >
            <p className="text-sm font-semibold text-gray-900">Categories</p>
            <p className="text-xs text-gray-500 mt-1">Parents, sub-categories, tags, persons</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <p>No transactions yet.</p>
            <p className="text-sm">Add one manually or paste an SMS!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
              <div key={date}>
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">{date}</p>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                  {groupedTransactions[date].map(t => {
                    const categoryDef = getCategoryByName(t.category);
                    
                    return (
                      <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            t.type === 'income' ? 'bg-green-100 text-green-600' : categoryDef.color
                          }`}>
                             {t.type === 'income' ? '💰' : categoryDef.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{t.merchant}</p>
                            <p className="text-xs text-gray-500">{t.category}</p>
                          </div>
                        </div>
                        <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
