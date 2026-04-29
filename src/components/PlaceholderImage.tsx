import React from 'react';

interface PlaceholderImageProps {
  name?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ name }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #10001a 0%, #1e0020 45%, #0a0010 100%)',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Brand glow — ambient radial behind logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 65% 45% at 50% 46%, rgba(228, 0, 124, 0.28) 0%, rgba(180, 0, 100, 0.10) 55%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle top-edge highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(228, 0, 124, 0.6) 40%, rgba(228, 0, 124, 0.6) 60%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span 
          style={{ 
            color: 'white', 
            fontSize: '36px', 
            fontWeight: 900, 
            fontStyle: 'italic', 
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: '0 4px 12px rgba(228, 0, 124, 0.5)'
          }}
        >
          SWIPESS
        </span>
      </div>

      {/* Listing name (if provided) */}
      {name && (
        <p
          style={{
            color: 'rgba(255,255,255,0.88)',
            fontSize: 17,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: 'center',
            padding: '0 28px',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </p>
      )}

      {/* Tagline */}
      <p
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.02em',
          padding: '0 32px',
        }}
      >
        No photos available yet
      </p>
    </div>
  );
};

export default PlaceholderImage;


