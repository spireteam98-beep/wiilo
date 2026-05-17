import '@/app/globals.css';
import ClientOnly from "@/components/ClientOnly";
import { Sidebar } from "@/components/Sidebar";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import type { Metadata } from "next";
import { Toaster as HotToaster } from "react-hot-toast";
// 1. Import Script component here
import Script from 'next/script';

export const metadata: Metadata = {
  title: "RoyalPay",
  description: "Secure Digital Payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link 
          rel="stylesheet" 
          href="https://open.spotifycdn.com/cdn/build/mobile-web-player/mobile-web-player7.7aeebbf9.css" 
        />
      </head>
      <body className="font-sans" suppressHydrationWarning={true}>
        {/* 2. Load Paystack Script here */}
        <Script 
          src="https://js.paystack.co/v1/inline.js" 
          strategy="beforeInteractive" 
        />
        
        <FirebaseClientProvider>
          <HotToaster />
          <ClientOnly>
            <Sidebar>
              {children}
            </Sidebar>
          </ClientOnly>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}