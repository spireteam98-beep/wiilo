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
        <link rel="stylesheet" href="https://01.cdn.mediatradecraft.com/theatlantic/main/main.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/e7749dd77b839c2d.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/fa00414794e489cc.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/538374b17c6bb26e.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/94d3d85b224b3f4a.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/e2c577d6624ee0e1.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/bbc9484956349c18.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/351f687542015689.css" />
        <link rel="stylesheet" href="https://cdn.theatlantic.com/_next/static/css/a6cc4a7a6462c4d1.css" />

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
          href="https://www.theatlantic.com/packages/fonts/graphik/Graphik-Regular-Web.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://www.theatlantic.com/packages/fonts/graphik/Graphik-Semibold-Web.woff2"
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
