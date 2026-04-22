import { type SVGProps } from 'react';

export function VespaIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      {/* Curved Scooter Body */}
      <path d="M12 44C12 44 14 26 30 26C46 26 54 44 54 44" strokeWidth="3" />
      <path d="M30 26V14H36" strokeWidth="3" />
      
      {/* Retro Seat */}
      <path d="M26 26C26 26 28 22 42 22C54 22 56 26 56 26" fill="currentColor" fillOpacity="0.15" />
      
      {/* Modern Wheels */}
      <circle cx="18" cy="46" r="8" strokeWidth="4" />
      <circle cx="48" cy="46" r="8" strokeWidth="4" />
      
      {/* Front Shield & Handlebars */}
      <path d="M30 14L24 10H16" strokeWidth="3" />
      <path d="M30 14L34 22" />
      
      {/* Retro Headlight */}
      <circle cx="34" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}


