
'use client';
import type { FC } from 'react';
import { CreditCard } from 'lucide-react';

const CardBalance: FC = () => {
  return (
    <section className="w-full max-w-md mx-auto text-center space-y-6 mb-6">
      <div className="rounded-xl text-white shadow-xl relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between bg-black border border-primary/20 p-4"> {/* Updated border color */}
        {/* Top Section: Sondar Logo, Chip (placeholder), Contactless (placeholder) */}
        <div className="flex justify-between items-start">
          {/* Sondar Logo - SVG */}
          <div className="flex items-center space-x-2">
            <svg
              width="100" // Adjusted width for better visibility of text
              height="30"
              viewBox="0 0 150 40" // Adjusted viewBox to accommodate text
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8" // Maintain height
            >
              {/* Green Flame Icon */}
              <path
                d="M15.36,8.47C15.36,8.47,12.54,12.06,10.5,14.67C8.46,17.28,6.6,20.16,6.6,20.16C6.6,20.16,9.24,20.94,11.7,21.5C14.16,22.06,16.08,22.21,16.08,22.21C16.08,22.21,17.28,19.05,17.82,15.9C18.36,12.75,18.36,10.02,18.36,10.02C18.36,10.02,17.16,8.95,15.36,8.47Z"
                fill="url(#flameGradient)"
              />
              <path
                d="M21.24,11.05C21.24,11.05,18.84,14.08,17.04,16.45C15.24,18.82,13.62,21.42,13.62,21.42C13.62,21.42,15.9,22.09,18.06,22.57C20.22,23.05,21.9,23.19,21.9,23.19C21.9,23.19,22.98,20.38,23.46,17.6C23.94,14.82,23.94,12.42,23.94,12.42C23.94,12.42,22.92,11.53,21.24,11.05Z"
                fill="url(#flameGradient)"
              />
               <path
                d="M10.5,6.5C10.5,6.5,8,9.5,6.5,11.5C5,13.5,4,16,4,16C4,16,6,16.5,8,17C10,17.5,11.5,17.8,11.5,17.8C11.5,17.8,12.5,15,13,12C13.5,9,13.5,7,13.5,7C13.5,7,12,6,10.5,6.5Z"
                fill="url(#flameGradient)"
              />
              <defs>
                <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.7}} />
                </linearGradient>
              </defs>
              {/* Sondar Text */}
              <text x="35" y="25" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fill="hsl(var(--foreground))" fontWeight="bold">
                Dhuux Card
              </text>
            </svg>
          </div>

          {/* Mastercard Logo */}
          <div className="flex flex-col items-end">
            <svg width="50" height="30" viewBox="0 0 70 40" xmlns="http://www.w3.org/2000/svg" className="h-8">
              <circle cx="20" cy="20" r="18" fill="#EA001B"/>
              <circle cx="50" cy="20" r="18" fill="#F79E1B"/>
              <path d="M35 20 C 35 29.941125 27.941125 38 20 38 C 12.058875 38 5 29.941125 5 20 C 5 10.058875 12.058875 2 20 2 C 27.941125 2 35 10.058875 35 20 Z M35 20 C 35 29.941125 42.058875 38 50 38 C 57.941125 38 65 29.941125 65 20 C 65 10.058875 57.941125 2 50 2 C 42.058875 2 35 10.058875 35 20 Z" fill="#FF5F00"/>
            </svg>
          </div>
        </div>

        {/* Middle Section: Card Number */}
        <div className="text-left my-auto">
          <p className="text-2xl tracking-wider font-mono">
            2121 2388 2921 2182
          </p>
        </div>

        {/* Bottom Section: Valid Thru, Cardholder Name, Card Type Logo */}
        <div className="flex justify-between items-end">
          <div className="text-left">
            <p className="text-[10px] uppercase opacity-80">VALID THRU</p>
            <p className="text-sm font-medium">12/28</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase opacity-80">Card Holder</p>
            <p className="text-sm font-medium">Daarin Mohamed</p>
          </div>
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardBalance;

