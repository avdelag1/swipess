import { useState, useEffect, useRef } from 'react';

interface ParallaxOffset {
  tiltX: number;
  tiltY: number;
}

/**
 * Hook to track device orientation for 3D parallax effects.
 * Returns smooth, jitter-free values based on how the device is held.
 */
export function useDeviceParallax(multiplier = 1, maxTilt = 45, enabled = true): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ tiltX: 0, tiltY: 0 });
  const currentOffset = useRef<ParallaxOffset>({ tiltX: 0, tiltY: 0 });
  const targetOffset = useRef<ParallaxOffset>({ tiltX: 0, tiltY: 0 });
  const lastSetOffset = useRef<ParallaxOffset>({ tiltX: 0, tiltY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent || !enabled) {
      return;
    }

    const DEAD_ZONE = 2;
    const MAX_PX = 8;
    const DAMPING = 0.04;
    const STATE_THRESHOLD = 0.3;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;

      const restingBeta = 60;
      let beta = event.beta - restingBeta;
      let gamma = event.gamma;

      if (Math.abs(beta) < DEAD_ZONE) beta = 0;
      if (Math.abs(gamma) < DEAD_ZONE) gamma = 0;

      beta = Math.max(-maxTilt, Math.min(maxTilt, beta));
      gamma = Math.max(-maxTilt, Math.min(maxTilt, gamma));

      const normalizedY = (beta / maxTilt) * multiplier;
      const normalizedX = (gamma / maxTilt) * multiplier;

      targetOffset.current = {
        tiltX: normalizedX * MAX_PX,
        tiltY: normalizedY * MAX_PX,
      };
    };

    let rafId: number;
    const animate = () => {
      currentOffset.current = {
        tiltX: currentOffset.current.tiltX + (targetOffset.current.tiltX - currentOffset.current.tiltX) * DAMPING,
        tiltY: currentOffset.current.tiltY + (targetOffset.current.tiltY - currentOffset.current.tiltY) * DAMPING,
      };

      const deltaX = Math.abs(currentOffset.current.tiltX - lastSetOffset.current.tiltX);
      const deltaY = Math.abs(currentOffset.current.tiltY - lastSetOffset.current.tiltY);

      if (deltaX > STATE_THRESHOLD || deltaY > STATE_THRESHOLD) {
        lastSetOffset.current = { ...currentOffset.current };
        setOffset({ ...currentOffset.current });
      }

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(rafId);
    };
  }, [multiplier, maxTilt, enabled]);

  return offset;
}


