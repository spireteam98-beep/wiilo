'use client';

import Script from 'next/script';

export default function Adsense() {
  return (
    <Script
      async
      strategy="afterInteractive"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8069025169541750"
      crossOrigin="anonymous"
    />
  );
}
