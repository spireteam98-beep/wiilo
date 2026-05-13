
'use client';
import { useState, useEffect } from 'react';
import MarketTabs from './MarketTabs';
import MarketList from './MarketList';
import { getTopCryptoPairs, type CryptoPair } from '@/services/crypto';

export default function MarketSection() {
  const [activeMainTab, setActiveMainTab] = useState("Favorites");
  const [activeSubTab, setActiveSubTab] = useState("Spot");
  const [marketPairs, setMarketPairs] = useState<CryptoPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Simulate fetching data based on tabs
      // In a real app, activeMainTab and activeSubTab would influence the API call
      console.log(`Fetching data for: ${activeMainTab} - ${activeSubTab}`);
      const pairs = await getTopCryptoPairs(6); // Fetch 6 pairs for 2x3 grid
      setMarketPairs(pairs);
      setLoading(false);
    }
    fetchData();
  }, [activeMainTab, activeSubTab]);

  return (
    <div className="bg-background">
      <MarketTabs
        activeMainTab={activeMainTab}
        onMainTabChange={setActiveMainTab}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
      />
      {loading ? (
        <div className="px-4 py-10 text-center text-muted-foreground">Loading market data...</div>
      ) : (
        <MarketList pairs={marketPairs} />
      )}
    </div>
  );
}
