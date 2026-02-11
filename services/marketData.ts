import { AssetRates } from "../types";

// Simulating a live feed since we don't have a specific public API key for this demo.
// In a real app, this would fetch from an API like GoldPriceEgypt or currency API.
export const fetchMarketRates = async (): Promise<AssetRates> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Base rates (approximate current market) with slight randomization for "Live" feel
  const baseUsd = 49.50;
  const baseGold = 3650; // 21k per gram

  const fluctuation = () => (Math.random() - 0.5) * 0.5;

  return {
    usdToEgp: Number((baseUsd + fluctuation()).toFixed(2)),
    gold21k: Number((baseGold + (fluctuation() * 10)).toFixed(0)),
    lastUpdated: new Date().toISOString()
  };
};