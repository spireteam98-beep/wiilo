// src/app/admin/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KeyFind Admin',
  description: 'Admin panel for KeyFind content management.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal layout, could add a specific admin navbar here if needed */}
      {children}
    </div>
  );
}
