'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import MainHeader from '@/components/layout/main-header';

// Dynamically import AudioPlayer with SSR disabled
const AudioPlayer = dynamic(
  () => import('@/components/layout/audio-player'),
  { ssr: false }
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="pb-48 md:pb-32">
            <MainHeader />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AudioPlayer />
    </div>
  );
}
