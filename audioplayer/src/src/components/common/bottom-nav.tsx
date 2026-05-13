
'use client';

import { Wallet, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { IntertwinedCirclesIcon } from "@/components/icons/intertwined-circles";
import { HomeFilledIcon } from "../icons/home-filled";
import { HomeIcon } from "../icons/home";
import { ShoppingBagFilledIcon } from "../icons/shopping-bag-filled";
import { AnalyticsIcon } from "../icons/analytics";

const navItems = [
  { href: "/", icon: HomeIcon, activeIcon: HomeFilledIcon, label: "Home" },
  { href: "#wallet", icon: Wallet, label: "Wallet" },
  { href: "#analytics", icon: AnalyticsIcon, label: "Analytics" },
  { href: "/shop", icon: ShoppingBag, activeIcon: ShoppingBagFilledIcon, label: "Shop" },
  { href: "#swap", icon: IntertwinedCirclesIcon, label: "Swap" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex max-w-md items-center justify-around h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
          const isShop = item.href === '/shop';
          return (
            <Link key={item.label} href={item.href} className="relative flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary w-14">
              <Icon className={`h-6 w-6 ${isActive ? "text-primary" : "text-white"}`} />
              <span className={`text-xs ${isActive ? "text-primary" : "text-white"}`}>{item.label}</span>
              {isShop && !isActive && <div className="absolute top-0 right-3 h-2 w-2 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
