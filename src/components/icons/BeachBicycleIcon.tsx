import { type SVGProps } from 'react';

export function BeachBicycleIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      {/* Wheels */}
      <circle cx="16" cy="46" r="9" strokeWidth="3" />
      <circle cx="48" cy="46" r="9" strokeWidth="3" />
      
      {/* Step-through Frame (Cruiser Style) */}
      <path d="M16 46C24 46 28 40 32 28H52L48 46" strokeWidth="3" />
      <path d="M32 28V12H42" strokeWidth="3" />
      
      {/* Front Basket */}
      <rect x="44" y="14" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M44 14l2 10M56 14l-2 10" />
      <path d="M44 19h12" />
      
      {/* Curved Handlebars */}
      <path d="M42 12C42 12 44 8 36 8" />
      
      {/* Seat */}
      <path d="M28 28c-2 0-4-2-4-4s2-4 4-4 4 2 4 4" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}


