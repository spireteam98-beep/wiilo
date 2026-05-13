import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/Dashboard.css";
import "./styles/Sounds.css";
import "./styles/CryptoWallet.css";
import "./styles/responsive.css";
import RootLayoutClient from "./RootLayoutClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoyalTV - Stream Premium Content",
  description: "Watch premium videos and read exclusive articles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* CSS Files */}
        <link
          rel="stylesheet"
          href="https://static.files.bbci.co.uk/sounds/web/sounds-web/css/sounds.b5f058e20032d7f8020f.css"
        />
        <link
          rel="stylesheet"
          href="https://static.files.bbci.co.uk/orbit/bde9d3f679d1dd3f8768859cc949031d/css/orbit-ltr.min.css"
        />
           <link
          rel="stylesheet"
          href="https://static.files.bbci.co.uk/sounds/web/sounds-web/css/sounds.b5f058e20032d7f8020f.css"
        />
         <link
          rel="stylesheet"
          href="https://netbeins.com/Sounds.css"
        />
            <link
          rel="stylesheet"
          href="https://netbeins.com/CryptoWallet.css"
        />
            <link
          rel="stylesheet"
          href="https://netbeins.com/Dashboard.css"
        />
        {/* Fonts */}
        <link
          rel="preload"
          href="https://static.files.bbci.co.uk/fonts/reith/2.512/BBCReithSans_W_Rg.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="https://static.files.bbci.co.uk/fonts/reith/2.512/BBCReithSans_W_Bd.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />

        {/* JavaScript Files */}
        <script src="https://nav.files.bbci.co.uk/orbit/3.0.0-536.85fa13b8/js/api.min.js" />
        <script src="https://static.files.bbci.co.uk/sounds/web/sounds-web/js/vendor.b5f058e20032d7f8020f.js" />
        <script src="https://static.files.bbci.co.uk/sounds/web/sounds-web/js/main.b5f058e20032d7f8020f.js" />
        <script src="https://static.files.bbci.co.uk/sounds/web/sounds-web/js/sounds.b5f058e20032d7f8020f.js" />
        
        {/* BBC Modules */}
        <script src="https://static.files.bbci.co.uk/account/id-cta/738/js/id-cta.js" />
        <script src="https://mybbc.files.bbci.co.uk/notification-ui/5.2.0/js/notifications.js" />
        <script src="https://static.files.bbci.co.uk/reverb/3.9.2/reverb.js" />
        <script src="https://static.files.bbci.co.uk/cookies/0.0.5-223.cc07cea/js/cookies.js" />
        <script src="https://static.files.bbci.co.uk/ukomtracking/1.1.2/js/ukomtracking.js" />
        
        {/* Analytics */}
        <script src="https://sa.bbc.co.uk/bbc/bbc/s?name=sounds.play.episode&ml_name=webmodule&ml_version=3.9.2&language=en&pal_route=episode&app_name=sounds&app_version=3.9.2&prod_name=sounds&bbc_site=sounds" />
        
        {/* Initialize BBC Modules */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              require(['orb/api'], function(orbApi) {
                orbApi.init();
              });

              require(['idcta/idcta-1'], function(idcta) {
                idcta.init();
              });

              require(['reverb/reverb-3'], function(reverb) {
                reverb.init();
              });
            `
          }}
        />
      </head>
      <body className={inter.className}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        
        {/* Additional Scripts that need to load after content */}
        <script src="https://cdn.optimizely.com/js/4802190303.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // BBC Analytics
              window.bbcpage = {
                loadModule: function(deps) {
                  return new Promise(function (resolve, reject) {
                    require(deps, function () {
                      resolve.apply(this, arguments);
                    });
                  });
                }
              };
            `
          }}
        />
      </body>
    </html>
  );
}