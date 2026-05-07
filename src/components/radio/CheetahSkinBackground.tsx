import cheetahPrint from '@/assets/cheetah-print.jpg';

/**
 * Photorealistic cheetah-fur skin used across all Radio surfaces.
 * - Fixed full-bleed image as the base.
 * - Layered dark vignette + bottom gradient to keep white text and icons readable.
 * - pointer-events: none so it never intercepts taps.
 */
export function CheetahSkinBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Base cheetah fur photograph */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${cheetahPrint})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'saturate(1.05) contrast(1.05)',
        }}
      />
      {/* Soft dark wash to anchor white UI elements */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      {/* Edge vignette for premium framing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}

export default CheetahSkinBackground;