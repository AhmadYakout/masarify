import React, { useState } from 'react';
import { RecurringBill } from '../types';

interface RecurringBillsProps {
  bills: RecurringBill[];
  onToggleBill: (id: string) => void;
  onAddBill: (bill: RecurringBill) => void;
  onDeleteBill: (id: string) => void;
}

const RecurringBills: React.FC<RecurringBillsProps> = ({ bills, onToggleBill, onAddBill, onDeleteBill }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  };

  const currentDay = new Date().getDate();

  const totalMonthly = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const totalRemaining = totalMonthly - totalPaid;
  const progress = totalMonthly > 0 ? (totalPaid / totalMonthly) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    const newBill: RecurringBill = {
      id: Date.now().toString(),
      name: newName,
      amount: parseFloat(newAmount),
      isPaid: false,
      dueDate: newDay ? parseInt(newDay) : 1
    };

    onAddBill(newBill);
    setNewName('');
    setNewAmount('');
    setNewDay('');
    setIsAdding(false);
  };

  const getStatusInfo = (bill: RecurringBill) => {
    if (bill.isPaid) return { label: 'Paid', color: 'text-green-600', bg: 'bg-green-100' };
    if (bill.dueDate < currentDay) return { label: `Overdue (${currentDay - bill.dueDate} days)`, color: 'text-red-600', bg: 'bg-red-50' };
    if (bill.dueDate === currentDay) return { label: 'Due Today', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: `Due in ${bill.dueDate - currentDay} days`, color: 'text-gray-500', bg: 'bg-gray-100' };
  };

  // Sort: Unpaid (overdue first, then upcoming), then Paid
  const sortedBills = [...bills].sort((a, b) => {
    if (a.isPaid === b.isPaid) {
      return a.dueDate - b.dueDate;
    }
    return a.isPaid ? 1 : -1;
  });

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Monthly Bills</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-cib-blue font-semibold text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Bill'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-gray-500 text-sm font-medium">Remaining to pay</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalRemaining)}</p>
          </div>
          <div className="text-right">
             <p className="text-gray-400 text-xs">Total Monthly</p>
             <p className="font-semibold text-gray-700">{formatCurrency(totalMonthly)}</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-cib-blue h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-cib-blue font-bold mt-2">{Math.round(progress)}% Paid</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="Bill Name (e.g. Rent, Netflix)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:border-cib-blue outline-none"
            required
            autoFocus
          />
          <div className="flex space-x-3">
             <input
              type="number"
              placeholder="Amount (EGP)"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:border-cib-blue outline-none"
              required
            />
            <input
              type="number"
              placeholder="Day (1-31)"
              value={newDay}
              onChange={e => setNewDay(e.target.value)}
              className="w-28 p-3 rounded-lg border border-gray-300 focus:border-cib-blue outline-none"
              min="1"
              max="31"
              required
            />
          </div>
          <button type="submit" className="w-full bg-cib-blue text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
            Save Bill
          </button>
        </form>
      )}

      {/* Bills List */}
      <div className="space-y-3">
        {sortedBills.map(bill => {
          const status = getStatusInfo(bill);
          return (
            <div 
              key={bill.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                bill.isPaid 
                  ? 'bg-green-50 border-green-200 opacity-75' 
                  : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => onToggleBill(bill.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    bill.isPaid 
                      ? 'bg-green-500 border-green-500 text-white scale-110' 
                      : 'bg-white border-gray-300 text-transparent hover:border-cib-blue'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div>
                  <p className={`font-bold text-lg ${bill.isPaid ? 'text-green-800 line-through decoration-green-800/50' : 'text-gray-900'}`}>
                    {bill.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
                      {status.label}
                    </span>
                    {!bill.isPaid && (
                      <span className="text-xs text-gray-400">Due day: {bill.dueDate}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <p className={`font-bold ${bill.isPaid ? 'text-green-700' : 'text-gray-900'}`}>
                  {formatCurrency(bill.amount)}
                </p>
                <button 
                  onClick={() => onDeleteBill(bill.id)}
                  className="text-xs text-red-300 hover:text-red-500 mt-2 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {bills.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="font-medium">No monthly bills yet</p>
            <p className="text-sm mt-1">Tap "+ Add Bill" to start tracking rent, subscriptions, or installments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringBills;