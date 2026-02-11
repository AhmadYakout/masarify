import React, { useState } from 'react';
import { AppView, Transaction, TransactionType, RecurringBill } from './types';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Navigation from './components/Navigation';
import Analytics from './components/Analytics';
import RecurringBills from './components/RecurringBills';
import AICoach from './components/AICoach';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', amount: 450, merchant: 'Vodafone Bill', category: 'Bills', date: new Date().toISOString(), type: 'expense', currency: 'EGP' },
    { id: '2', amount: 15000, merchant: 'Freelance Work', category: 'Salary', date: new Date().toISOString(), type: 'income', currency: 'EGP' }
  ]);

  // Recurring Bills State
  const [bills, setBills] = useState<RecurringBill[]>([
    { id: '1', name: 'Home Rent', amount: 4000, isPaid: false, dueDate: 1 },
    { id: '2', name: 'Car Installment', amount: 2500, isPaid: true, dueDate: 15 },
    { id: '3', name: 'Netflix', amount: 200, isPaid: false, dueDate: 28 },
  ]);

  const totalBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  const handleAddTransaction = (amount: number, merchant: string, category: string, type: TransactionType) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      merchant,
      category,
      type,
      date: new Date().toISOString(),
      currency: 'EGP'
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleToggleBill = (id: string) => {
    setBills(prev => prev.map(bill => 
      bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
    ));
  };

  const handleAddBill = (bill: RecurringBill) => {
    setBills(prev => [...prev, bill]);
  };

  const handleDeleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard transactions={transactions} totalBalance={totalBalance} />;
      case AppView.ADD_TRANSACTION:
        return <AddTransaction onAdd={handleAddTransaction} onCancel={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.ANALYTICS:
        return <Analytics transactions={transactions} />;
      case AppView.BILLS:
        return (
          <RecurringBills 
            bills={bills} 
            onToggleBill={handleToggleBill} 
            onAddBill={handleAddBill}
            onDeleteBill={handleDeleteBill}
          />
        );
      case AppView.COACH:
        return <AICoach />;
      default:
        return <Dashboard transactions={transactions} totalBalance={totalBalance} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl overflow-hidden">
      {renderView()}
      {currentView !== AppView.ADD_TRANSACTION && (
        <Navigation currentView={currentView} onChangeView={setCurrentView} />
      )}
    </div>
  );
};

export default App;