import { type SVGProps } from 'react';

interface MotorcycleIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export function MotorcycleIcon({ className, ...props }: MotorcycleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Front wheel */}
      <circle cx="18.5" cy="17.5" r="3.5" />
      {/* Rear wheel */}
      <circle cx="5.5" cy="17.5" r="3.5" />
      {/* Frame - body line */}
      <path d="M15 17.5l-3-7h4l2-4" />
      {/* Seat to rear */}
      <path d="M12 10.5L5.5 14" />
      {/* Handlebar */}
      <path d="M16 6.5l2.5-1" />
      {/* Engine area */}
      <path d="M9 14l3-3.5" />
    </svg>
  );
}


