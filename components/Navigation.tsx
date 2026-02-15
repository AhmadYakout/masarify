import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  unreadNotifications?: number;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, unreadNotifications = 0 }) => {
  const isViewActive = (view: AppView): boolean => {
    if (view === AppView.DASHBOARD && currentView === AppView.CATEGORIES) {
      return true;
    }
    return currentView === view;
  };

  const navItemClass = (view: AppView) =>
    `relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 rounded-lg active:scale-[0.98] ${
      isViewActive(view) ? 'text-cib-blue bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.18)] z-50 max-w-md mx-auto pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="h-[4.5rem] grid grid-cols-5 items-center px-2 gap-1">
      <button onClick={() => onChangeView(AppView.DASHBOARD)} className={navItemClass(AppView.DASHBOARD)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] font-semibold">Home</span>
      </button>

      <button onClick={() => onChangeView(AppView.ANALYTICS)} className={navItemClass(AppView.ANALYTICS)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-[10px] font-semibold">Analytics</span>
      </button>

      <button onClick={() => onChangeView(AppView.ADD_TRANSACTION)} className={navItemClass(AppView.ADD_TRANSACTION)}>
        <div className="bg-cib-blue text-white rounded-full p-2.5 shadow-md border border-cib-blue/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-[10px] font-semibold text-cib-blue">Add</span>
      </button>

      <button onClick={() => onChangeView(AppView.NOTIFICATIONS)} className={navItemClass(AppView.NOTIFICATIONS)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>
        <span className="text-[10px] font-semibold">Alerts</span>
        {unreadNotifications > 0 && (
          <span className="absolute top-2 right-3 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[1.05rem] text-center font-bold">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      <button onClick={() => onChangeView(AppView.BILLS)} className={navItemClass(AppView.BILLS)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-[10px] font-semibold">Bills</span>
      </button>
      </div>
    </div>
  );
};

export default Navigation;
