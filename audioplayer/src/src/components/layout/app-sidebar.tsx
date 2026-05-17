'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Home, Library, ListMusic, Radio, Settings, Video } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Custom App logo icon
const AppLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0Z" fill="url(#paint0_linear_1_2)"/>
        <path d="M72 50L39 69.0526V30.9474L72 50Z" fill="white"/>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4B0082"/>
                <stop offset="1" stopColor="#BF00FF"/>
            </linearGradient>
        </defs>
    </svg>
);


const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/browse', label: 'Browse', icon: Radio },
    { href: '/library', label: 'Your Library', icon: Library },
    { href: '/playlist', label: 'Playlist', icon: ListMusic },
    { href: '/video', label: 'Video', icon: Video },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
            <AppLogo className="w-8 h-8" />
            <h1 className="text-xl font-bold font-headline text-foreground">AudioFlow</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarMenu className="p-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenuButton asChild tooltip="Settings">
            <Link href="#">
                <Settings />
                <span>Settings</span>
            </Link>
          </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
