// src/components/shared/SubTabs.tsx
'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SubTabsProps<T extends string> {
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

const SubTabs = <T extends string>({ tabs, activeTab, onTabChange, className }: SubTabsProps<T>) => {
  return (
    <div className={`sticky top-0 bg-background z-10 py-3 ${className || ''}`}>
      <ScrollArea className="w-full whitespace-nowrap px-4 md:px-0">
        <div className="flex space-x-2.5">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab)}
              className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-300 h-auto
                ${activeTab === tab
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-neutral-700 text-white hover:bg-neutral-600'
                }`}
            >
              {tab}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default SubTabs;
