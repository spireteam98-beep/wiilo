// src/components/exchange/TopHeader.tsx
'use client';
import type { FC } from 'react';
import { Headphones, LogIn, UserCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import SignOutButton from '@/components/auth/SignOutButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';

const TopHeader: FC = () => {
  const { user, loading } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return <UserCircle className="h-8 w-8 text-primary" />;
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-background sticky top-0 z-50 border-b border-border/50">
      {loading ? (
         <Skeleton className="h-8 w-8 rounded-full" />
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt={user.displayName || 'User Avatar'} data-ai-hint="user avatar" />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center w-full">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/auth/signin" passHref>
          <Button variant="ghost" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </Link>
      )}

      <Tabs defaultValue="exchange" className="w-auto">
        <TabsList className="bg-card border border-border p-0.5 rounded-md">
          <TabsTrigger value="exchange" className="px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm">Exchange</TabsTrigger>
          <TabsTrigger value="web3" className="px-4 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-sm">WEB3</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button variant="ghost" size="icon" aria-label="Support">
        <Headphones className="h-6 w-6 text-primary" />
      </Button>
    </header>
  );
};

export default TopHeader;
