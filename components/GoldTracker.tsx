import React, { useEffect, useState } from 'react';
import { fetchMarketRates } from '../services/marketData';
import { AssetRates } from '../types';

interface GoldTrackerProps {
  totalBalanceEgp: number;
}

const GoldTracker: React.FC<GoldTrackerProps> = ({ totalBalanceEgp }) => {
  const [rates, setRates] = useState<AssetRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      const data = await fetchMarketRates();
      setRates(data);
      setLoading(false);
    };
    loadRates();
    // Refresh every 30 seconds
    const interval = setInterval(loadRates, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Market Data...</div>;

  const goldEquivalent = rates ? totalBalanceEgp / rates.gold21k : 0;
  const usdEquivalent = rates ? totalBalanceEgp / rates.usdToEgp : 0;

  return (
    <div className="p-4 pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Wealth</h2>

      {/* Gold Card */}
      <div className="bg-egypt-gold rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4V4m2 4v2h12V8H6m0 4v2h12v-2H6m0 4v2h12v-2H6z"/></svg>
        </div>
        <p className="text-yellow-100 text-sm font-medium uppercase tracking-wider">Gold 21k Live</p>
        <div className="flex items-end space-x-2 mt-2">
            <h3 className="text-4xl font-bold">{rates?.gold21k.toLocaleString()}</h3>
            <span className="mb-2 text-yellow-100">EGP/gram</span>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-yellow-50">Your balance is worth:</p>
            <p className="text-2xl font-bold">{goldEquivalent.toFixed(2)} <span className="text-base font-normal">grams</span></p>
        </div>
      </div>

      {/* USD Card */}
      <div className="bg-nbe-green rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="absolute right-0 top-0 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05.69 1.64 1.83 1.64.93 0 1.6-.45 1.6-1.26 0-.71-.53-1.23-2-1.61-2.1-.54-3.15-1.53-3.15-2.88 0-1.77 1.39-2.92 3.03-3.26V5h2.67v1.9c1.6.45 2.58 1.49 2.7 3h-1.92c-.09-.76-.52-1.26-1.54-1.26-.85 0-1.39.42-1.39 1.13 0 .73.68 1.12 1.89 1.48 2.08.59 3.26 1.63 3.26 3.02 0 1.81-1.35 2.94-3.36 3.22z"/></svg>
        </div>
        <p className="text-green-100 text-sm font-medium uppercase tracking-wider">USD Exchange Rate</p>
         <div className="flex items-end space-x-2 mt-2">
            <h3 className="text-4xl font-bold">{rates?.usdToEgp.toFixed(2)}</h3>
            <span className="mb-2 text-green-100">EGP</span>
        </div>
         <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-green-50">Your balance is worth:</p>
            <p className="text-2xl font-bold">${usdEquivalent.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default GoldTracker;