import { useState, useEffect, useRef } from 'react';

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
  const currentOffset = useRef<ParallaxOffset>({ tiltX: 0, tiltY: 0 });
  const targetOffset = useRef<ParallaxOffset>({ tiltX: 0, tiltY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;

      // We assume device is normally held at ~45-60 degrees beta (tilted up towards face).
      const restingBeta = 60; 
      let beta = event.beta - restingBeta; 
      let gamma = event.gamma; 

      // Clamp values
      if (beta > maxTilt) beta = maxTilt;
      if (beta < -maxTilt) beta = -maxTilt;
      if (gamma > maxTilt) gamma = maxTilt;
      if (gamma < -maxTilt) gamma = -maxTilt;

      // Normalize to -1 to 1
      const normalizedY = (beta / maxTilt) * multiplier;
      const normalizedX = (gamma / maxTilt) * multiplier;

      targetOffset.current = {
        tiltX: normalizedX * 25, // max 25px/deg
        tiltY: normalizedY * 25,
      };
    };

    // Animation loop for damping
    let rafId: number;
    const animate = () => {
      const damping = 0.08; // 0.1 = faster, 0.01 = slower/smoother
      
      currentOffset.current = {
        tiltX: currentOffset.current.tiltX + (targetOffset.current.tiltX - currentOffset.current.tiltX) * damping,
        tiltY: currentOffset.current.tiltY + (targetOffset.current.tiltY - currentOffset.current.tiltY) * damping,
      };

      setOffset({ ...currentOffset.current });
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(rafId);
    };
  }, [multiplier, maxTilt]);

  return offset;
}
