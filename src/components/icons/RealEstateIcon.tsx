import { type SVGProps } from 'react';

export function RealEstateIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      {/* Bold Modern House Frame */}
      <path d="M8 28L32 6L56 28V58H8V28Z" fill="currentColor" fillOpacity="0.1" />
      
      {/* High-Contrast Entrance */}
      <path d="M26 58V40H38V58" strokeWidth="4" />
      
      {/* Simplified Windows for clarity */}
      <path d="M16 38h6v6h-6zM42 38h6v6h-6z" strokeWidth="2.5" />
    </svg>
  );
}
