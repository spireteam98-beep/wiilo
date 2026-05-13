import type { ReactNode } from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import AudioPlayer from '@/components/layout/audio-player';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import MainHeader from '@/components/layout/main-header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="pb-48 md:pb-32"> {/* Player height compensation */}
            <MainHeader />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AudioPlayer />
    </div>
  );
}
