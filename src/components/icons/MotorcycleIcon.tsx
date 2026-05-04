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
      {/* Helmet on top */}
      <path d="M6 7.5a6 6 0 0 1 12 0v1.5H6z" />
      {/* Visor */}
      <path d="M8.5 7.5h7" />
      {/* Wheel (tire) */}
      <circle cx="12" cy="16" r="5.5" />
      {/* Hub */}
      <circle cx="12" cy="16" r="1" />
      {/* Spokes */}
      <path d="M12 10.5v11" />
      <path d="M6.5 16h11" />
      <path d="M8.1 12.1l7.8 7.8" />
      <path d="M15.9 12.1l-7.8 7.8" />
    </svg>
  );
}


