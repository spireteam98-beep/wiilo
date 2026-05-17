"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MonitorDot, 
  Users, 
  Settings, 
  LogOut,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  Truck,
  Users2,
  Wallet,
  Store,
  FileText,
  Loader2,
  Home
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTenant, reset } = useStore();
  
  // 1. Fetch global mapping to get tenantId
  const globalUserRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users_global', user.uid);
  }, [firestore, user?.uid]);

  const { data: globalUserData, isLoading: isGlobalLoading } = useDoc(globalUserRef);

  // 2. Fetch detailed tenant info
  const tenantRef = useMemoFirebase(() => {
    if (!firestore || !globalUserData?.tenantId) return null;
    return doc(firestore, 'tenants', globalUserData.tenantId);
  }, [firestore, globalUserData?.tenantId]);

  const { data: tenantData, isLoading: isTenantLoading } = useDoc(tenantRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signin');
    } else if (user && !user.emailVerified) {
      router.push('/verify-email');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (tenantData) {
      setTenant({
        id: tenantData.id,
        name: tenantData.name,
        type: tenantData.industryType || 'Shop',
      });
    } else if (!isGlobalLoading && !isTenantLoading && !globalUserData) {
      if (user && user.emailVerified) {
        router.push('/onboarding');
      }
    }
  }, [tenantData, globalUserData, isGlobalLoading, isTenantLoading, user, setTenant, router]);

  if (isUserLoading || isGlobalLoading || isTenantLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.emailVerified || !globalUserData) return null;

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    reset();
    router.push('/');
  };

  const mainNav = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'POS Terminal', icon: MonitorDot, path: '/dashboard/pos' },
    { label: 'Inventory', icon: Package, path: '/dashboard/inventory' },
    { label: 'Sales History', icon: ShoppingCart, path: '/dashboard/sales' },
  ];

  const operationalNav = [
    { label: 'Public Showreel', icon: Home, path: '/' },
    { label: 'Procurement', icon: Truck, path: '/dashboard/procurement' },
    { label: 'Customers', icon: Users2, path: '/dashboard/customers' },
    { label: 'Finance', icon: Wallet, path: '/dashboard/finance' },
    { label: 'AI Assistant', icon: Sparkles, path: '/dashboard/ai-assistant' },
  ];

  const adminNav = [
    { label: 'Branches', icon: Store, path: '/dashboard/branches' },
    { label: 'Staff & Roles', icon: Users, path: '/dashboard/staff' },
    { label: 'Reports', icon: FileText, path: '/dashboard/reports' },
    { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar collapsible="icon" className="bg-white/55 backdrop-blur-[20px] border-r border-white/65">
          <SidebarHeader className="h-20 flex items-center px-6">
            <div className="flex items-center gap-3">
              <div className="brand-mark">
                <span className="brand-dot brand-dot-1"></span>
                <span className="brand-dot brand-dot-2"></span>
                <span className="brand-dot brand-dot-3"></span>
              </div>
              <span className="font-extrabold text-2xl tracking-tighter wiillo-grad-text group-data-[collapsible=icon]:hidden">
                wiillo
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <div className="mx-2 mb-6 p-4 rounded-2xl bg-white/72 border border-border shadow-wiillo cursor-pointer flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <div className="overflow-hidden">
                <strong className="block text-sm font-bold truncate">{tenantData?.name || 'Workspace'}</strong>
                <span className="block text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">Active Workspace</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted" />
            </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted/60 mb-2 group-data-[collapsible=icon]:hidden">COMMERCE</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.path}
                        className={cn(
                          "transition-all duration-200 rounded-2xl h-11 px-4 mb-1",
                          pathname === item.path ? "bg-primary/5 text-foreground shadow-[inset_0_0_0_1px_rgba(124,58,237,0.08)]" : "text-muted hover:bg-white/70 hover:text-foreground"
                        )}
                      >
                        <Link href={item.path} className="flex items-center gap-3">
                          <item.icon className="h-4.5 w-4.5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted/60 mb-2 group-data-[collapsible=icon]:hidden">OPERATIONS</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operationalNav.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.path}
                        className={cn(
                          "transition-all duration-200 rounded-2xl h-11 px-4 mb-1",
                          pathname === item.path ? "bg-primary/5 text-foreground shadow-[inset_0_0_0_1px_rgba(124,58,237,0.08)]" : "text-muted hover:bg-white/70 hover:text-foreground"
                        )}
                      >
                        <Link href={item.path} className="flex items-center gap-3">
                          <item.icon className="h-4.5 w-4.5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted/60 mb-2 group-data-[collapsible=icon]:hidden">ADMINISTRATION</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.path}
                        className={cn(
                          "transition-all duration-200 rounded-2xl h-11 px-4 mb-1",
                          pathname === item.path ? "bg-primary/5 text-foreground shadow-[inset_0_0_0_1px_rgba(124,58,237,0.08)]" : "text-muted hover:bg-white/70 hover:text-foreground"
                        )}
                      >
                        <Link href={item.path} className="flex items-center gap-3">
                          <item.icon className="h-4.5 w-4.5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 bg-transparent border-t border-white/20">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout} 
                  className="rounded-2xl h-11 text-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 bg-transparent">
          <header className="h-20 bg-transparent flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="md:hidden" />
              <div className="relative w-full max-w-sm hidden md:block group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search products, orders, customers..." 
                  className="pl-11 h-12 bg-white/75 border-white/80 shadow-wiillo rounded-2xl focus-visible:ring-primary/20 transition-all" 
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="relative rounded-2xl hover:bg-white/70 transition-colors">
                <Bell className="h-5 w-5 text-muted" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
              </Button>
              <div className="h-8 w-px bg-border/50"></div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">PLATFORM OWNER</p>
                </div>
                <Avatar className="h-11 w-11 rounded-2xl border-2 border-white shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/44/44`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-8 pt-2">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
