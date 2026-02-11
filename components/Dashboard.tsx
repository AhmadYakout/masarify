import React from 'react';
import { Transaction } from '../types';
import { getCategoryByName } from '../data/categories';

interface DashboardProps {
  transactions: Transaction[];
  totalBalance: number;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, totalBalance }) => {
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
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
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