import React from 'react';
import { Transaction } from '../types';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  };

  // Filter for expenses (exclude income)
  const expenseTransactions = transactions.filter(t => t.type === 'expense' || t.type === 'installment');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 1. Group by Category
  const categoryMap: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categoryData = Object.keys(categoryMap)
    .map(cat => ({
      name: cat,
      amount: categoryMap[cat],
      percentage: totalExpenses > 0 ? (categoryMap[cat] / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Group by Merchant (Top Spenders)
  const merchantMap: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + t.amount;
  });

  const merchantData = Object.keys(merchantMap)
    .map(mer => ({
      name: mer,
      amount: merchantMap[mer]
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5

  const topCategory = categoryData.length > 0 ? categoryData[0] : null;
  const topMerchant = merchantData.length > 0 ? merchantData[0] : null;
  const maxMerchantAmount = merchantData.length > 0 ? merchantData[0].amount : 1;

  // 3. Monthly Income vs Expense Stats
  const monthlyStats: Record<string, { income: number; expense: number; dateObj: number }> = {};

  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., "Oct 2023"
    
    if (!monthlyStats[key]) {
      monthlyStats[key] = { income: 0, expense: 0, dateObj: d.getTime() };
    }

    if (t.type === 'income') {
      monthlyStats[key].income += t.amount;
    } else {
      monthlyStats[key].expense += t.amount;
    }
  });

  const monthlyData = Object.keys(monthlyStats).map(key => ({
    month: key,
    income: monthlyStats[key].income,
    expense: monthlyStats[key].expense,
    dateObj: monthlyStats[key].dateObj
  })).sort((a, b) => b.dateObj - a.dateObj); // Sort descending (newest first)

  const maxMonthlyVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);

  return (
    <div className="p-4 pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Spending Analytics</h2>

      {/* Highlights Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Top Category</p>
          <p className="text-gray-900 font-bold text-lg mt-1 truncate">{topCategory ? topCategory.name : '-'}</p>
          <p className="text-red-600 font-medium text-sm">{topCategory ? formatCurrency(topCategory.amount) : 'EGP 0'}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Top Merchant</p>
          <p className="text-gray-900 font-bold text-lg mt-1 truncate">{topMerchant ? topMerchant.name : '-'}</p>
          <p className="text-blue-600 font-medium text-sm">{topMerchant ? formatCurrency(topMerchant.amount) : 'EGP 0'}</p>
        </div>
      </div>

      {/* Monthly Cash Flow Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Monthly Cash Flow</h3>
        {monthlyData.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-sm">No transaction data available.</p>
        ) : (
          <div className="space-y-4">
            {monthlyData.map((m) => {
              const net = m.income - m.expense;
              const isPositive = net >= 0;
              
              return (
                <div key={m.month} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-gray-700">{m.month}</p>
                    <div className={`text-xs font-bold px-2 py-1 rounded-md flex items-center space-x-1 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       <span>{isPositive ? 'Net Savings:' : 'Deficit:'}</span>
                       <span>{isPositive ? '+' : ''}{formatCurrency(net)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Income Bar */}
                    <div className="flex items-center">
                      <div className="w-14 text-xs text-gray-500 font-medium">In</div>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden mx-2">
                        <div 
                          className="h-full bg-nbe-green rounded-full transition-all duration-500" 
                          style={{ width: `${(m.income / maxMonthlyVal) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-20 text-right text-xs font-bold text-nbe-green">{formatCurrency(m.income)}</div>
                    </div>
                    
                    {/* Expense Bar */}
                    <div className="flex items-center">
                      <div className="w-14 text-xs text-gray-500 font-medium">Out</div>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden mx-2">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all duration-500" 
                          style={{ width: `${(m.expense / maxMonthlyVal) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-20 text-right text-xs font-bold text-red-500">{formatCurrency(m.expense)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Expenses by Category</h3>
        {categoryData.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-sm">No expenses to analyze yet.</p>
        ) : (
          <div className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-cib-blue h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{cat.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Merchants List */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Top Spending Merchants</h3>
         {merchantData.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-4">
            {merchantData.map((mer, index) => (
              <div key={mer.name}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">{mer.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(mer.amount)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden ml-7 w-[calc(100%-1.75rem)]">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full opacity-60" 
                    style={{ width: `${(mer.amount / maxMerchantAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;