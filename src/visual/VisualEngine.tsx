import { useTheme } from "@/hooks/useTheme";
import { useVisualPreferences } from "@/hooks/useVisualPreferences";
import LandingBackgroundEffects from "@/components/LandingBackgroundEffects";

export const VisualEngine = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { preferences } = useVisualPreferences();

  // If globally disabled or off, show nothing (or just the noise)
  if (!preferences.enable_background_effects) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 transition-colors duration-500 bg-background"
      />
      {!isLight && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />
      )}
      
      <LandingBackgroundEffects
        mode={preferences.background_mode || 'stars'}
        isLightTheme={isLight}
        disableSounds={true}
      />
    </div>
  );
};

