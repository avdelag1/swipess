import { useEffect, useState } from 'react';
import { Card } from './ui/card';

// Only render in development mode
const isDev = import.meta.env.DEV;

export function PerformanceMonitor() {
  // Return null immediately in production
  if (!isDev) return null;

  return <PerformanceMonitorInner />;
}

function PerformanceMonitorInner() {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFPS = (currentTime: number) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFps);
        
        // Memory usage (if available)
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          setMemory(Math.round(mem.usedJSHeapSize / 1048576));
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-3 z-[9999] bg-black/80 text-white backdrop-blur-sm border border-white/10">
      <div className="text-xs space-y-1 font-mono">
        <div className={fps < 30 ? 'text-red-500' : fps < 50 ? 'text-yellow-500' : 'text-green-500'}>
          FPS: {fps}
        </div>
        {memory > 0 && (
          <div className={memory > 100 ? 'text-red-500' : 'text-gray-300'}>
            RAM: {memory}MB
          </div>
        )}
      </div>
    </Card>
  );
}
