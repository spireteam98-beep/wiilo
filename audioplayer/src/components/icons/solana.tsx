
import type { SVGProps } from 'react';

export const SolanaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8.25L12 3.75L20 8.25L12 12.75L4 8.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M20 15.75L12 20.25L4 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 8.25V15.75L12 12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 8.25V15.75L12 12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
