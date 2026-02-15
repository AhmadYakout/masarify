import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppNotification,
  AppView,
  TransactionMetadata,
  PaymentCandidate,
  RecurringBill,
  SmsDetectionSource,
  Transaction,
  TransactionType,
} from './types';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Navigation from './components/Navigation';
import Analytics from './components/Analytics';
import RecurringBills from './components/RecurringBills';
import NotificationsCenter from './components/NotificationsCenter';
import AuthGate from './components/AuthGate';
import Settings from './components/Settings';
import CategoryManager from './components/CategoryManager';
import {
  DEFAULT_BILLS,
  DEFAULT_TRANSACTIONS,
  addRecurringBill,
  buildManualTransaction,
  calculateTotalBalance,
  deleteRecurringBill,
  loadBills,
  loadTransactions,
  saveBills,
  saveTransactions,
  toggleRecurringBill,
} from './modules/transactions';
import {
  attachNativePaymentBridge,
  confirmCandidate,
  dismissCandidate,
  loadPaymentCandidates,
  queueDetectedCandidate,
  savePaymentCandidates,
  startPaymentMessageIngestion,
} from './modules/sms';
import {
  buildSystemNotification,
  loadAppNotifications,
  markNotificationRead,
  saveAppNotifications,
  sendLocalPushNotification,
} from './modules/notifications';
import {
  changePassword,
  AuthSession,
  getCurrentUser,
  isAuthApiNetworkError,
  isAuthApiRetryableError,
  loadAuthSession,
  saveAuthSession,
} from './modules/auth';
import {
  DEFAULT_CATEGORY_STATE,
  archiveCategory,
  createParentCategory,
  createPerson,
  createSubCategory,
  createTag,
  deleteTagWithCleanup,
  loadCategoryState,
  renameCategory,
  renamePerson,
  renameTag,
  saveCategoryState,
  setPersonActiveWithCleanup,
} from './modules/categories';
import { CategoryState } from './modules/categories';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [bills, setBills] = useState<RecurringBill[]>(DEFAULT_BILLS);
  const [paymentCandidates, setPaymentCandidates] = useState<PaymentCandidate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [categoryState, setCategoryState] = useState<CategoryState>(DEFAULT_CATEGORY_STATE);
  const [isStorageHydrated, setIsStorageHydrated] = useState<boolean>(false);
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const transactionsRef = useRef<Transaction[]>(DEFAULT_TRANSACTIONS);
  const billsRef = useRef<RecurringBill[]>(DEFAULT_BILLS);
  const paymentCandidatesRef = useRef<PaymentCandidate[]>([]);
  const notificationsRef = useRef<AppNotification[]>([]);
  const categoryStateRef = useRef<CategoryState>(DEFAULT_CATEGORY_STATE);

  const logPersistenceError = useCallback((entity: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown persistence error';
    console.error(`[Masarify][Persistence] Failed to persist ${entity}: ${message}`);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydratePersistedState = async () => {
      try {
        const [
          loadedTransactions,
          loadedBills,
          loadedPaymentCandidates,
          loadedNotifications,
          loadedAuthSession,
          loadedCategoryState,
        ] = await Promise.all([
          loadTransactions(),
          loadBills(),
          loadPaymentCandidates(),
          loadAppNotifications(),
          loadAuthSession(),
          loadCategoryState(),
        ]);

        if (cancelled) {
          return;
        }

        setTransactions(loadedTransactions);
        setBills(loadedBills);
        setPaymentCandidates(loadedPaymentCandidates);
        setNotifications(loadedNotifications);
        setAuthSession(loadedAuthSession);
        setCategoryState(loadedCategoryState);
        transactionsRef.current = loadedTransactions;
        billsRef.current = loadedBills;
        paymentCandidatesRef.current = loadedPaymentCandidates;
        notificationsRef.current = loadedNotifications;
        categoryStateRef.current = loadedCategoryState;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown hydration error';
        console.error(`[Masarify][Persistence] Failed to hydrate persisted state: ${message}`);
      } finally {
        if (!cancelled) {
          setIsStorageHydrated(true);
        }
      }
    };

    void hydratePersistedState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    billsRef.current = bills;
  }, [bills]);

  useEffect(() => {
    paymentCandidatesRef.current = paymentCandidates;
  }, [paymentCandidates]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    categoryStateRef.current = categoryState;
  }, [categoryState]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void saveTransactions(transactions).catch((error) => logPersistenceError('transactions', error));
  }, [isStorageHydrated, logPersistenceError, transactions]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void saveBills(bills).catch((error) => logPersistenceError('bills', error));
  }, [bills, isStorageHydrated, logPersistenceError]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void savePaymentCandidates(paymentCandidates).catch((error) =>
      logPersistenceError('payment candidates', error)
    );
  }, [isStorageHydrated, logPersistenceError, paymentCandidates]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void saveAppNotifications(notifications).catch((error) =>
      logPersistenceError('notifications', error)
    );
  }, [isStorageHydrated, logPersistenceError, notifications]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void saveAuthSession(authSession).catch((error) => logPersistenceError('auth session', error));
  }, [authSession, isStorageHydrated, logPersistenceError]);

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }
    void saveCategoryState(categoryState).catch((error) => logPersistenceError('category state', error));
  }, [categoryState, isStorageHydrated, logPersistenceError]);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!isStorageHydrated) {
        return;
      }

      if (!authSession) {
        if (!cancelled) {
          setIsSessionChecking(false);
        }
        return;
      }

      if (!cancelled) {
        setIsSessionChecking(true);
      }

      try {
        await getCurrentUser(authSession.accessToken);
      } catch (error) {
        if (isAuthApiNetworkError(error) || isAuthApiRetryableError(error)) {
          if (!cancelled) {
            setIsSessionChecking(false);
          }
          return;
        }
        if (!cancelled) {
          setAuthSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsSessionChecking(false);
        }
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [authSession, isStorageHydrated]);

  const totalBalance = calculateTotalBalance(transactions);

  const handleDetectedPayment = useCallback((rawMessage: string, source: SmsDetectionSource): boolean => {
    const result = queueDetectedCandidate(
      paymentCandidatesRef.current,
      notificationsRef.current,
      rawMessage,
      source
    );
    if (!result.accepted) {
      return false;
    }

    paymentCandidatesRef.current = result.candidates;
    notificationsRef.current = result.notifications;
    setPaymentCandidates(result.candidates);
    setNotifications(result.notifications);
    if (result.pushNotification) {
      void sendLocalPushNotification(result.pushNotification);
    }

    return true;
  }, []);

  useEffect(() => {
    return attachNativePaymentBridge();
  }, []);

  useEffect(() => {
    return startPaymentMessageIngestion((event) => {
      handleDetectedPayment(event.rawMessage, event.source);
    });
  }, [handleDetectedPayment]);

  const handleAddTransaction = (
    amount: number,
    merchant: string,
    category: string,
    type: TransactionType,
    metadata: TransactionMetadata
  ) => {
    const result = buildManualTransaction(categoryStateRef.current, {
      amount,
      merchant,
      category,
      type,
      metadata,
    });
    if (!result.isValid) {
      const errorMessage =
        'error' in result
          ? result.error
          : 'Please review category selection and try again.';
      const validationErrorNotification = buildSystemNotification(
        'Invalid classification',
        errorMessage
      );
      setNotifications((prev) => [validationErrorNotification, ...prev]);
      return;
    }

    setTransactions((prev) => {
      const nextTransactions = [result.transaction, ...prev];
      transactionsRef.current = nextTransactions;
      return nextTransactions;
    });
    setCurrentView(AppView.DASHBOARD);
  };

  const handleToggleBill = (id: string) => {
    setBills((prev) => {
      const nextBills = toggleRecurringBill(prev, id);
      billsRef.current = nextBills;
      return nextBills;
    });
  };

  const handleAddBill = (bill: RecurringBill) => {
    setBills((prev) => {
      const nextBills = addRecurringBill(prev, bill);
      billsRef.current = nextBills;
      return nextBills;
    });
  };

  const handleDeleteBill = (id: string) => {
    setBills((prev) => {
      const nextBills = deleteRecurringBill(prev, id);
      billsRef.current = nextBills;
      return nextBills;
    });
  };

  const handleConfirmCandidate = (candidateId: string) => {
    const result = confirmCandidate(
      paymentCandidatesRef.current,
      transactionsRef.current,
      notificationsRef.current,
      candidateId
    );
    if (!result.changed) {
      return;
    }

    paymentCandidatesRef.current = result.candidates;
    transactionsRef.current = result.transactions;
    notificationsRef.current = result.notifications;
    setPaymentCandidates(result.candidates);
    setTransactions(result.transactions);
    setNotifications(result.notifications);
    if (result.pushNotification) {
      void sendLocalPushNotification(result.pushNotification);
    }
  };

  const handleDismissCandidate = (candidateId: string) => {
    const result = dismissCandidate(paymentCandidatesRef.current, notificationsRef.current, candidateId);
    if (!result.changed) {
      return;
    }

    paymentCandidatesRef.current = result.candidates;
    notificationsRef.current = result.notifications;
    setPaymentCandidates(result.candidates);
    setNotifications(result.notifications);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications((prev) => {
      const nextNotifications = markNotificationRead(prev, notificationId);
      notificationsRef.current = nextNotifications;
      return nextNotifications;
    });
  };

  const applyCategoryStateChange = (apply: (previousState: CategoryState) => CategoryState): void => {
    try {
      const nextState = apply(categoryStateRef.current);
      categoryStateRef.current = nextState;
      setCategoryState(nextState);
    } catch (error) {
      const notification = buildSystemNotification('Category update failed', toErrorMessage(error));
      setNotifications((previousNotifications) => [notification, ...previousNotifications]);
    }
  };

  const handleCreateParentCategory = (name: string) => {
    applyCategoryStateChange((previousState) => createParentCategory(previousState, name));
  };

  const handleCreateSubCategory = (parentId: string, name: string) => {
    applyCategoryStateChange((previousState) => createSubCategory(previousState, parentId, name));
  };

  const handleRenameCategory = (categoryId: string, name: string) => {
    applyCategoryStateChange((previousState) => renameCategory(previousState, categoryId, name));
  };

  const handleArchiveCategory = (categoryId: string) => {
    applyCategoryStateChange((previousState) => archiveCategory(previousState, categoryId));
  };

  const handleCreateTag = (name: string) => {
    applyCategoryStateChange((previousState) => createTag(previousState, name));
  };

  const handleRenameTag = (tagId: string, name: string) => {
    applyCategoryStateChange((previousState) => renameTag(previousState, tagId, name));
  };

  const handleDeleteTag = (tagId: string) => {
    try {
      const result = deleteTagWithCleanup(categoryStateRef.current, transactionsRef.current, tagId);
      categoryStateRef.current = result.categoryState;
      transactionsRef.current = result.transactions;
      setCategoryState(result.categoryState);
      setTransactions(result.transactions);
    } catch (error) {
      const notification = buildSystemNotification('Tag update failed', toErrorMessage(error));
      setNotifications((previousNotifications) => [notification, ...previousNotifications]);
    }
  };

  const handleCreatePerson = (name: string) => {
    applyCategoryStateChange((previousState) => createPerson(previousState, name));
  };

  const handleRenamePerson = (personId: string, name: string) => {
    applyCategoryStateChange((previousState) => renamePerson(previousState, personId, name));
  };

  const handleSetPersonActive = (personId: string, isActive: boolean) => {
    try {
      const result = setPersonActiveWithCleanup(
        categoryStateRef.current,
        transactionsRef.current,
        personId,
        isActive
      );
      categoryStateRef.current = result.categoryState;
      transactionsRef.current = result.transactions;
      setCategoryState(result.categoryState);
      setTransactions(result.transactions);
    } catch (error) {
      const notification = buildSystemNotification('Person update failed', toErrorMessage(error));
      setNotifications((previousNotifications) => [notification, ...previousNotifications]);
    }
  };

  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;

  const handleAuthenticated = (session: AuthSession) => {
    setAuthSession(session);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleChangePassword = async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (!authSession) {
      throw new Error('Not authenticated');
    }
    await changePassword(authSession.accessToken, oldPassword, newPassword, confirmPassword);
  };

  if (isSessionChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!authSession) {
    return <AuthGate onAuthenticated={handleAuthenticated} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            transactions={transactions}
            totalBalance={totalBalance}
            onOpenSettings={() => setCurrentView(AppView.SETTINGS)}
            onOpenCategories={() => setCurrentView(AppView.CATEGORIES)}
            onAddTransaction={() => setCurrentView(AppView.ADD_TRANSACTION)}
            onOpenNotifications={() => setCurrentView(AppView.NOTIFICATIONS)}
            onOpenBills={() => setCurrentView(AppView.BILLS)}
          />
        );
      case AppView.ADD_TRANSACTION:
        return (
          <AddTransaction
            categories={categoryState.categories}
            tags={categoryState.tags}
            persons={categoryState.persons}
            onAdd={handleAddTransaction}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
            onDetectedPayment={handleDetectedPayment}
            onOpenCategoryManager={() => setCurrentView(AppView.CATEGORIES)}
          />
        );
      case AppView.CATEGORIES:
        return (
          <CategoryManager
            categories={categoryState.categories}
            tags={categoryState.tags}
            persons={categoryState.persons}
            onCreateParentCategory={handleCreateParentCategory}
            onCreateSubCategory={handleCreateSubCategory}
            onRenameCategory={handleRenameCategory}
            onArchiveCategory={handleArchiveCategory}
            onCreateTag={handleCreateTag}
            onRenameTag={handleRenameTag}
            onDeleteTag={handleDeleteTag}
            onCreatePerson={handleCreatePerson}
            onRenamePerson={handleRenamePerson}
            onSetPersonActive={handleSetPersonActive}
          />
        );
      case AppView.ANALYTICS:
        return <Analytics transactions={transactions} />;
      case AppView.NOTIFICATIONS:
        return (
          <NotificationsCenter
            candidates={paymentCandidates}
            notifications={notifications}
            onConfirmCandidate={handleConfirmCandidate}
            onDismissCandidate={handleDismissCandidate}
            onMarkNotificationRead={handleMarkNotificationRead}
          />
        );
      case AppView.BILLS:
        return (
          <RecurringBills 
            bills={bills} 
            onToggleBill={handleToggleBill} 
            onAddBill={handleAddBill}
            onDeleteBill={handleDeleteBill}
          />
        );
      case AppView.SETTINGS:
        return (
          <Settings
            mobile={authSession.user.mobile}
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <Dashboard
            transactions={transactions}
            totalBalance={totalBalance}
            onOpenSettings={() => setCurrentView(AppView.SETTINGS)}
            onOpenCategories={() => setCurrentView(AppView.CATEGORIES)}
            onAddTransaction={() => setCurrentView(AppView.ADD_TRANSACTION)}
            onOpenNotifications={() => setCurrentView(AppView.NOTIFICATIONS)}
            onOpenBills={() => setCurrentView(AppView.BILLS)}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl overflow-hidden">
      {renderView()}
      {currentView !== AppView.ADD_TRANSACTION && (
        <Navigation
          currentView={currentView}
          onChangeView={setCurrentView}
          unreadNotifications={unreadNotificationsCount}
        />
      )}
    </div>
  );
};

export default App;
