import React from 'react';
import { motion } from 'framer-motion';

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
        background: '#060608',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,77,0,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Logo text */}
        <span
          style={{
            color: 'white',
            fontSize: '2.8rem',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: 0.12,
          }}
        >
          SWIPESS
        </span>

        {/* Pulsing dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
              animate={{ opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>

        {name && (
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
              padding: '0 32px',
              letterSpacing: '-0.01em',
              marginTop: 8,
            }}
          >
            {name}
          </p>
        )}

        <p
          style={{
            color: 'rgba(255,255,255,0.18)',
            fontSize: 11,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Waiting for photos
        </p>
      </div>
    </div>
  );
};

export default PlaceholderImage;
