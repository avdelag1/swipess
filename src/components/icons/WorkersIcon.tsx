import { type SVGProps } from 'react';

export function WorkersIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      {/* Central Worker */}
      <circle cx="32" cy="18" r="8" strokeWidth="3" />
      <path d="M16 52V42C16 36 22 30 32 30C42 30 48 36 48 42V52" strokeWidth="3" fill="currentColor" fillOpacity="0.05" />
      
      {/* Side Worker Left */}
      <circle cx="16" cy="24" r="6" />
      <path d="M4 52V46C4 41 8 38 14 38C20 38 24 41 24 46V52" />
      
      {/* Side Worker Right */}
      <circle cx="48" cy="24" r="6" />
      <path d="M40 52V46C40 41 44 38 50 38C56 38 60 41 60 46V52" />
      
      {/* Collaborative Detail (Connection) */}
      <path d="M24 46h16" strokeDasharray="4 4" opacity="0.5" />
    </svg>
  );
}

