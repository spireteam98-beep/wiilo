import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Mohamed Royal',
  description: 'Mohamed Royal - editorial blog and article platform.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://abs.twimg.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://abs.twimg.com/responsive-web/client-web/Chirp-Regular.80fda27a.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://abs.twimg.com/responsive-web/client-web/Chirp-Medium.f8e2739a.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://abs.twimg.com/responsive-web/client-web/Chirp-Bold.ebb56aba.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://www.theatlantic.com/packages/fonts/garamond/AGaramondPro-Regular.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://www.theatlantic.com/packages/fonts/logic/LogicMonospace-Medium.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://www.theatlantic.com/packages/fonts/logic/LogicMonospace-Regular.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <Analytics />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
