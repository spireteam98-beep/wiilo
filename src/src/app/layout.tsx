import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals1.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * GLOBAL METADATA
 * This handles the default title and OG tags for your site.
 */
export const metadata: Metadata = {
  title: 'Mohamed Royal',
  description: 'Watch premium videos and read exclusive articles',
  openGraph: {
    title: 'Royal Notes',
    description: 'Watch premium videos and read exclusive articles',
    url: 'https://mohamedroyal.com', // Replace with your actual domain
    siteName: 'Royal',
    images: [
      {
        // Default image for the home page
        url: '/api/og?title=Dhuux&description=Watch premium videos and read exclusive articles',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhuux',
    description: 'Watch premium videos and read exclusive articles',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* NOTE: No <Head> tag needed here. 
          Next.js automatically injects metadata from the object above. 
      */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <PlayerProvider>
            {children}
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}