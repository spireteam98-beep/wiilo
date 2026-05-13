import type { SVGProps } from 'react';

export const IntertwinedCirclesIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    stroke="currentColor"
    strokeWidth="2"
    {...props}
  >
    <circle cx="9" cy="12" r="4"/>
    <circle cx="15" cy="12" r="4"/>
  </svg>
);
