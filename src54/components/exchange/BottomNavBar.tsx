'use client';

import type { FC } from 'react';
import { Home, Search, MusicIcon as LucideSounds } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  icon?: React.ElementType; 
  targetTab: string;
}

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tabLabel: string) => void;
  userAvatar?: string | null;
}

const BottomNavBar: FC<BottomNavBarProps> = ({ activeTab, onTabChange, userAvatar }) => {
  const navItems: NavItem[] = [
    { label: 'Home', icon: Home, targetTab: 'Home' },
    { label: 'Search', icon: Search, targetTab: 'Markets' },
    { label: 'Sounds', icon: LucideSounds, targetTab: 'Sounds' },
    { label: 'Account', targetTab: 'Account' },
  ];

  return (
    <footer 
      /* REMOVED 'md:hidden' so it stays visible on Desktop */
      className="fixed bottom-0 left-0 right-0 h-16 z-50 shadow-lg"
      style={{
        background: 'linear-gradient(to right, hsl(240.92deg 90.16% 34.45%), hsl(330deg 90.16% 21.61%))',
      }}
    >
      <nav className="flex justify-around items-center h-full px-1 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.targetTab;
          const isAccount = item.targetTab === 'Account';

          return (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                'flex flex-col items-center justify-center space-y-1 w-full h-full rounded-md p-2 transition-all duration-200 ease-in-out flex-1',
                isActive ? 'text-primary-foreground font-bold bg-white/10' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/5'
              )}
              onClick={() => onTabChange(item.targetTab)}
              aria-current={isActive ? "page" : undefined}
            >
              {isAccount ? (
                <Avatar className={cn(
                  'h-7 w-7 border transition-all duration-300',
                  isActive ? 'border-white scale-110 shadow-md' : 'border-white/20'
                )}>
                  <AvatarImage src={userAvatar || ''} />
                  <AvatarFallback className="text-[10px] bg-white/20 text-white font-bold">
                    U
                  </AvatarFallback>
                </Avatar>
              ) : (
                item.icon && <item.icon className={cn('h-6 w-6', isActive ? 'stroke-[2.5px]' : 'stroke-[2px]')} />
              )}
              
              <span className={cn('text-[10px] tracking-tight', isActive ? 'font-bold' : 'font-medium')}>
                {item.label === 'Account' ? 'My Account' : item.label}
              </span>
            </Button>
          );
        })}
      </nav>
    </footer>
  );
};

export default BottomNavBar;