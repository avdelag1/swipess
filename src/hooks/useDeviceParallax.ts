import { useState, useEffect } from 'react';

interface ParallaxOffset {
  tiltX: number;
  tiltY: number;
}

/**
 * Hook to track device orientation for 3D parallax effects.
 * Returns normalized values between -1 and 1 based on how the device is held.
 * 
 * @param multiplier Adjusts the intensity of the effect
 * @param maxTilt The maximum degrees of physical tilt before maxing out
 */
export function useDeviceParallax(multiplier = 1, maxTilt = 45): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ tiltX: 0, tiltY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      return;
    }

    let isSupported = false;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      isSupported = true;

      // beta: front-to-back tilt in degrees (normally between -180 and 180)
      // gamma: left-to-right tilt in degrees (normally between -90 and 90)
      
      // We assume device is normally held at ~45 degrees beta (tilted up towards face).
      const restingBeta = 45;
      let beta = event.beta - restingBeta; // -45 to +45 range from resting
      let gamma = event.gamma; // -90 to +90

      // Clamp values
      if (beta > maxTilt) beta = maxTilt;
      if (beta < -maxTilt) beta = -maxTilt;
      if (gamma > maxTilt) gamma = maxTilt;
      if (gamma < -maxTilt) gamma = -maxTilt;

      // Normalize to -1 to 1
      const normalizedY = (beta / maxTilt) * multiplier;
      const normalizedX = (gamma / maxTilt) * multiplier;

      setOffset({
        tiltX: normalizedX * 20, // max 20px translation or degrees rotation
        tiltY: normalizedY * 20,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [multiplier, maxTilt]);

  return offset;
}
