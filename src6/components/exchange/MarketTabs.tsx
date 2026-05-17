
'use client';
import type { FC } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MarketTabsProps {
  activeMainTab: string;
  onMainTabChange: (value: string) => void;
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
}

const mainTabs = ["Favorites", "Hot", "New", "Gainers", "Losers", "Turnover"];
// Simulating Spotify's filter buttons like "All", "Music", "Podcasts"
const spotifyStyleTabs = ["All", "Music", "Podcasts"]; 
const subTabs = ["Spot", "Derivatives"];

const MarketTabs: FC<MarketTabsProps> = ({ activeMainTab, onMainTabChange, activeSubTab, onSubTabChange }) => {
  // For this specific styling, we will use spotifyStyleTabs. 
  // If activeMainTab logic needs to be different, this would need adjustment.
  // We'll map activeMainTab to one of these if needed, or assume activeMainTab is one of these for styling.
  // For simplicity, let's use spotifyStyleTabs directly.
  
  return (
    <div className="px-4 pt-4 bg-background">
      <ScrollArea className="w-full whitespace-nowrap">
        <Tabs 
          value={activeMainTab} // Still controlled by activeMainTab for general logic
          onValueChange={onMainTabChange} 
          className="w-max"
        >
          {/* Apply Spotify-like filter button styling to TabsList and TabsTrigger */}
          <TabsList className="bg-transparent p-0 space-x-2.5"> 
            {spotifyStyleTabs.map((tab) => ( // Using spotifyStyleTabs for rendering
              <TabsTrigger
                key={tab}
                value={tab} // Value should match what activeMainTab can be
                className={`px-4 py-2 font-bold rounded-[20px] transition-colors duration-300
                            data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                            data-[state=inactive]:bg-[#2a2a2a] data-[state=inactive]:text-white hover:bg-[#444]
                            data-[state=inactive]:hover:text-white`}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {/* Sub-tabs logic can remain if still needed for certain main tabs */}
      {/* This example assumes "All" tab might show sub-tabs, adjust as per actual app logic */}
      {activeMainTab === "All" && ( 
        <div className="mt-3">
          <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card border-border p-0.5">
              {subTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="px-3 py-1.5 text-xs data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default MarketTabs;
