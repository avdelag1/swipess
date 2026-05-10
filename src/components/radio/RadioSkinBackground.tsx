import { CheetahSkinBackground } from './CheetahSkinBackground';
import { useRadioSkin } from '@/hooks/useRadioSkin';

/**
 * Radio surface background. Switches between the cheetah-fur skin and a
 * theme-aware solid surface so the radio respects the active app theme.
 */
export function RadioSkinBackground() {
  const { skin } = useRadioSkin();

  if (skin === 'cheetah') return <CheetahSkinBackground />;

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden bg-background"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 30%, hsl(var(--primary) / 0.10), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 55%, hsl(var(--background) / 0.6) 100%)',
        }}
      />
    </div>
  );
}

export default RadioSkinBackground;
