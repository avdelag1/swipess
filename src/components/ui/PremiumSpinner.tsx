import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumSpinnerProps {
  className?: string;
}

export function PremiumSpinner({ className }: PremiumSpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="premium-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D00" />
          <stop offset="100%" stopColor="#EB4898" />
        </linearGradient>
        <filter id="premium-spinner-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background track (subtle) */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="url(#premium-spinner-gradient)"
        strokeWidth="8"
        strokeOpacity="0.2"
        strokeLinecap="round"
      />

      {/* Foreground elastic segment */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="url(#premium-spinner-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="250"
        strokeDashoffset="100"
        filter="url(#premium-spinner-glow)"
        className="animate-[spin_1.5s_ease-in-out_infinite]"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}
