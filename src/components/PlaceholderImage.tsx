import React from 'react';

const FALLBACK_PLACEHOLDER = '/placeholder.svg';

interface PlaceholderImageProps {
  name?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ name }) => {
  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.2) 100%)',
        zIndex: 1,
      }}
    >
      <img
        src={FALLBACK_PLACEHOLDER}
        alt={name ? `${name} placeholder` : 'Placeholder'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default PlaceholderImage;
