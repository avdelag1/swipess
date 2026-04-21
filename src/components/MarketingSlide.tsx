import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, Bike, Wrench, Star, MessageCircle, AlertTriangle, Zap } from 'lucide-react';
import { RadarSearchIcon } from '@/components/ui/RadarSearchEffect';

interface MarketingSlideProps {
    slideId: string;
}

const slideData: Record<string, {
    title: string;
    subtitle: string;
    icon: React.ComponentType<any>;
    gradient: string;
    badge?: string;
}> = {
    // PROPERTY
    'marketing:property:slide1': {
        title: 'DirectOwner',
        subtitle: 'Communicate directly with property owners. Zero hidden commissions or agency fees.',
        icon: MessageCircle,
        gradient: 'from-blue-600/80 to-indigo-900/80',
        badge: 'No Middlemen'
    },
    'marketing:property:slide2': {
        title: 'Legal Protection',
        subtitle: 'Access our verified legal services to ensure your rental agreement is safe and secure.',
        icon: Scale,
        gradient: 'from-rose-600/80 to-teal-900/80',
        badge: 'Secure Renting'
    },
    'marketing:property:slide3': {
        title: 'Verified Hosts',
        subtitle: 'Every listing is checked by our team. Swipe with confidence knowing the properties are real.',
        icon: ShieldCheck,
        gradient: 'from-brand-accent/80 to-brand-primary/80',
        badge: '100% Verified'
    },

    // MOTORCYCLE / BICYCLE (VEHICLES)
    'marketing:moto:slide1': {
        title: 'Find Your Ride',
        subtitle: 'From city commuters to highway cruisers. Filter exactly the horsepower or style you need.',
        icon: Bike,
        gradient: 'from-slate-700/80 to-slate-900/80',
        badge: 'Smart Filters'
    },
    'marketing:moto:slide2': {
        title: 'Transparent Pricing',
        subtitle: 'Know the real price upfront. Negotiate safely using our in-app messaging system.',
        icon: Star,
        gradient: 'from-amber-500/80 to-orange-800/80',
        badge: 'Fair Value'
    },
    'marketing:moto:slide3': {
        title: 'Service Qualification',
        subtitle: 'Review the service history and seller rating before you buy. Quality is our standard.',
        icon: Wrench,
        gradient: 'from-brand-primary/80 to-rose-900/80',
        badge: 'Quality Assured'
    },

    // BICYCLE
    'marketing:bicycle:slide1': {
        title: 'Perfect Match',
        subtitle: 'Discover road, mountain, and e-bikes tailored to your exact riding style.',
        icon: Bike,
        gradient: 'from-teal-600/80 to-rose-900/80',
        badge: 'Cycle Smarter'
    },
    'marketing:bicycle:slide2': {
        title: 'Direct Deals',
        subtitle: 'Buy directly from fellow cyclists. No markup, just honest transactions.',
        icon: MessageCircle,
        gradient: 'from-blue-500/80 to-indigo-800/80',
        badge: 'Community First'
    },
    'marketing:bicycle:slide3': {
        title: 'Ride Safe',
        subtitle: 'All sellers are verified. Enjoy peace of mind from browse to buy.',
        icon: ShieldCheck,
        gradient: 'from-brand-accent/80 to-orange-900/80',
        badge: 'Verified Sellers'
    },

    // WORKERS / SERVICES
    'marketing:worker:slide1': {
        title: 'Trusted Pros',
        subtitle: 'Find verified professionals, from electricians to private chefs. Your safety is our priority.',
        icon: ShieldCheck,
        gradient: 'from-purple-600/80 to-violet-900/80',
        badge: 'Safety First'
    },
    'marketing:worker:slide2': {
        title: 'Real Reviews',
        subtitle: 'Hire based on genuine community reviews. Know exactly who you are bringing to your home.',
        icon: Star,
        gradient: 'from-blue-600/80 to-cyan-900/80',
        badge: 'Community Rated'
    },
    'marketing:worker:slide3': {
        title: 'Easy Claims',
        subtitle: 'If something goes wrong, our straightforward complaint system is always here to help you.',
        icon: AlertTriangle,
        gradient: 'from-brand-primary/80 to-red-900/80',
        badge: 'Full Support'
    },

    // CLIENTS
    'marketing:client:slide1': {
        title: 'Find Your Match',
        subtitle: 'Discover individuals genuinely looking for what you have to offer.',
        icon: RadarSearchIcon,
        gradient: 'from-brand-accent/80 to-brand-primary/80',
        badge: 'Smart Matching'
    },
    'marketing:client:slide2': {
        title: 'Verified Profiles',
        subtitle: 'We verify every user so you can chat and transact with confidence.',
        icon: ShieldCheck,
        gradient: 'from-blue-600/80 to-teal-800/80',
        badge: 'Secure Connections'
    },
    'marketing:client:slide3': {
        title: 'Direct Chat',
        subtitle: 'No middlemen. Message clients instantly when you both swipe right.',
        icon: MessageCircle,
        gradient: 'from-purple-500/80 to-pink-800/80',
        badge: 'Instant Comm'
    },
    'marketing:direct:deal': {
        title: 'Direct Deals',
        subtitle: 'Swipe and get your best offer today. No middlemen, no junk, just results.',
        icon: Zap,
        gradient: 'from-orange-500/80 to-rose-900/80',
        badge: 'Top Value'
    }
};

const MarketingSlideComponent = ({ slideId }: MarketingSlideProps) => {
    const data = slideData[slideId] || {
        title: 'Welcome to Swipess',
        subtitle: 'Swipe right to discover your next match.',
        icon: Star,
        gradient: 'from-brand-primary/90 to-brand-accent/90',
        badge: 'Start Swiping'
    };

    const Icon = data.icon;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '24px',
                zIndex: 1,
            }}
            className={`bg-gradient-to-br ${data.gradient} flex flex-col items-center justify-center p-8 text-white relative`}
        >
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-30">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_50%)] blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center space-y-6"
            >
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>

                {data.badge && (
                    <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-bold tracking-widest uppercase shadow-sm">
                        {data.badge}
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tight leading-none drop-shadow-md">
                        {data.title}
                    </h2>
                    <p className="text-lg font-medium text-white/90 max-w-xs mx-auto drop-shadow-sm">
                        {data.subtitle}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export const MarketingSlide = memo(MarketingSlideComponent);


