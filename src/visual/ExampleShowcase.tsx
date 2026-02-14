import {
  PremiumButton,
  IconButton,
  FloatingActionButton,
  PremiumCard,
  FeatureCard,
  GlowCard,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SlideIn,
  PulseGlow,
  FloatEffect,
  ShimmerEffect,
} from "@/visual";
import { Sparkles, Zap, Heart, Plus, Star, Rocket } from "lucide-react";

/**
 * Visual System Showcase
 * Demonstrates all premium components
 *
 * Usage: Import this page to see examples of all visual components
 * Route: Add to your app for testing/demo purposes
 */
export const VisualShowcase = () => {
  return (
    <div className="min-h-screen p-6 md:p-12 space-y-12">
      {/* Header */}
      <FadeIn>
        <div className="text-center space-y-4">
          <FloatEffect>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Premium Visual System
            </h1>
          </FloatEffect>
          <p className="text-lg text-muted-foreground">
            Cinematic luxury meets SaaS polish
          </p>
        </div>
      </FadeIn>

      {/* Buttons Section */}
      <SlideIn direction="up" delay={0.1}>
        <PremiumCard variant="glass" size="lg">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Premium Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <PremiumButton variant="glass">Glass Button</PremiumButton>
            <PremiumButton variant="solid">Solid Button</PremiumButton>
            <PremiumButton variant="outline">Outline Button</PremiumButton>
            <PremiumButton variant="ghost">Ghost Button</PremiumButton>
            <PremiumButton variant="luxury" hoverEffect="prominent">
              Luxury Button
            </PremiumButton>
          </div>

          <div className="mt-6 flex gap-4 items-center">
            <IconButton>
              <Heart className="w-5 h-5" />
            </IconButton>
            <IconButton size="lg">
              <Star className="w-6 h-6" />
            </IconButton>
            <FloatingActionButton>
              <Plus className="w-6 h-6" />
            </FloatingActionButton>
          </div>
        </PremiumCard>
      </SlideIn>

      {/* Cards Section */}
      <SlideIn direction="up" delay={0.2}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Premium Cards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PremiumCard variant="glass">
              <h3 className="font-semibold mb-2">Glass Card</h3>
              <p className="text-sm text-muted-foreground">
                Subtle glass morphism with backdrop blur
              </p>
            </PremiumCard>

            <PremiumCard variant="elevated">
              <h3 className="font-semibold mb-2">Elevated Card</h3>
              <p className="text-sm text-muted-foreground">
                Premium shadow with soft borders
              </p>
            </PremiumCard>

            <PremiumCard variant="luxury">
              <h3 className="font-semibold mb-2">Luxury Card</h3>
              <p className="text-sm text-muted-foreground">
                Maximum depth and cinematic feel
              </p>
            </PremiumCard>
          </div>
        </div>
      </SlideIn>

      {/* Feature Cards */}
      <SlideIn direction="up" delay={0.3}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Feature Showcase</h2>

          <StaggerContainer staggerDelay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StaggerItem>
                <FeatureCard
                  icon={<Sparkles className="w-8 h-8" />}
                  title="Smooth Animations"
                  description="Apple-level polish with premium easing curves"
                />
              </StaggerItem>

              <StaggerItem>
                <FeatureCard
                  icon={<Zap className="w-8 h-8" />}
                  title="Lightning Fast"
                  description="GPU-accelerated for 60fps performance"
                />
              </StaggerItem>

              <StaggerItem>
                <FeatureCard
                  icon={<Rocket className="w-8 h-8" />}
                  title="Cinematic Depth"
                  description="Layered backgrounds with ambient motion"
                />
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </SlideIn>

      {/* Glow Cards */}
      <SlideIn direction="up" delay={0.4}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Glow Effects</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlowCard glowColor="primary">
              <h3 className="font-semibold mb-2">Primary Glow</h3>
              <p className="text-sm text-muted-foreground">
                Subtle animated glow effect
              </p>
            </GlowCard>

            <GlowCard glowColor="purple">
              <h3 className="font-semibold mb-2">Purple Glow</h3>
              <p className="text-sm text-muted-foreground">
                Luxury purple accent
              </p>
            </GlowCard>

            <GlowCard glowColor="blue">
              <h3 className="font-semibold mb-2">Blue Glow</h3>
              <p className="text-sm text-muted-foreground">
                Cinematic blue depth
              </p>
            </GlowCard>
          </div>
        </div>
      </SlideIn>

      {/* Micro-interactions */}
      <SlideIn direction="up" delay={0.5}>
        <PremiumCard variant="glass" size="lg">
          <h2 className="text-2xl font-semibold mb-6">Micro-interactions</h2>

          <div className="space-y-6">
            {/* Pulse Glow */}
            <div>
              <h3 className="font-medium mb-3">Pulse Glow</h3>
              <div className="flex gap-4">
                <PulseGlow glowColor="primary" intensity="low">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </div>
                </PulseGlow>

                <PulseGlow glowColor="purple" intensity="medium">
                  <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </PulseGlow>

                <PulseGlow glowColor="blue" intensity="high">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                </PulseGlow>
              </div>
            </div>

            {/* Float Effect */}
            <div>
              <h3 className="font-medium mb-3">Float Effect</h3>
              <FloatEffect distance={12} duration={3}>
                <PremiumCard variant="luxury" className="inline-block">
                  <p className="text-sm">I'm floating gently ✨</p>
                </PremiumCard>
              </FloatEffect>
            </div>

            {/* Shimmer Effect */}
            <div>
              <h3 className="font-medium mb-3">Shimmer Effect</h3>
              <ShimmerEffect>
                <PremiumCard variant="elevated">
                  <p className="text-sm">Watch the shimmer pass over me ✨</p>
                </PremiumCard>
              </ShimmerEffect>
            </div>
          </div>
        </PremiumCard>
      </SlideIn>

      {/* Footer */}
      <FadeIn delay={0.6}>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            Built with Framer Motion, Tailwind CSS, and attention to detail
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Premium Visual System for Swipess
          </p>
        </div>
      </FadeIn>
    </div>
  );
};
