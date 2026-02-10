import { Card } from './card';
import { Button } from './button';
import { TiltCard } from './tilt-card';
import { ProgressiveImage } from './progressive-image';
import { Skeleton } from './skeleton';
import { useBlurOnScroll } from '@/hooks/useBlurOnScroll';
import { cn } from '@/lib/utils';

/**
 * Modern Showcase Component
 * Demonstrates all the new professional UI improvements:
 * - Enhanced skeleton loaders with shimmer
 * - Ripple effects on buttons
 * - 3D card tilt on hover
 * - Progressive image loading
 * - Blur-on-scroll navigation
 * - Animated gradient backgrounds
 * - Smooth micro-interactions
 */

export const ModernShowcase = () => {
  const isScrolled = useBlurOnScroll(50);

  return (
    <div className="relative min-h-screen">
      {/* Blur-on-scroll navigation demo */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 p-4 blur-on-scroll',
          isScrolled && 'scrolled'
        )}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Modern UI Features</h1>
          <Button variant="default">Try Ripple Effect</Button>
        </div>
      </div>

      <div className="pt-24 px-4 max-w-7xl mx-auto space-y-12">
        {/* Skeleton Loaders */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Enhanced Skeleton Loaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </section>

        {/* 3D Tilt Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3D Tilt Cards (Hover Me!)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TiltCard intensity={3}>
              <Card className="p-6 bg-gradient-to-br from-red-600 to-pink-500 text-white">
                <h3 className="text-xl font-bold mb-2">Card 1</h3>
                <p>Hover over me to see the 3D tilt effect</p>
              </Card>
            </TiltCard>
            <TiltCard intensity={3}>
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <h3 className="text-xl font-bold mb-2">Card 2</h3>
                <p>Professional and subtle interaction</p>
              </Card>
            </TiltCard>
            <TiltCard intensity={3}>
              <Card className="p-6 bg-gradient-to-br from-green-500 to-teal-500 text-white">
                <h3 className="text-xl font-bold mb-2">Card 3</h3>
                <p>Smooth perspective transforms</p>
              </Card>
            </TiltCard>
          </div>
        </section>

        {/* Button Ripple Effects */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Interactive Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="premium">Premium</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click any button to see the ripple effect and press feedback
          </p>
        </section>

        {/* Progressive Image Loading */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Progressive Image Loading</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Progressive Image Demo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Images load with blur-up effect
              </p>
            </Card>
            <Card className="p-4">
              <div className="w-full h-64 bg-gradient-to-br from-pink-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Progressive Image Demo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Smooth transition from blur to sharp
              </p>
            </Card>
          </div>
        </section>

        {/* Hover Effects */}
        <section className="space-y-4 pb-12">
          <h2 className="text-2xl font-bold">Hover Glow Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 hover-glow cursor-pointer">
                <div className="text-4xl mb-2">✨</div>
                <h3 className="font-semibold">Feature {i}</h3>
                <p className="text-sm text-muted-foreground">
                  Hover for smooth elevation
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
