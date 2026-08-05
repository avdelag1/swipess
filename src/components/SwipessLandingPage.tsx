import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Lock, Heart, ShieldCheck, Search, Plus, MessageSquare, MapPin, Star, Users, CheckCircle, Smartphone } from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import { AccessCodeGate } from './AccessCodeGate';

const PROPERTIES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    price: '$12,500',
    title: 'Modern Villa',
    location: 'Tulum, MX'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    price: '$8,200',
    title: 'Luxury Mansion',
    location: 'Miami, FL'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    price: '$15,000',
    title: 'Oceanfront Estate',
    location: 'Ibiza, ES'
  }
];

export default function SwipessLandingPage({ onSecretAccess }: { onSecretAccess: () => void }) {
  const [showGate, setShowGate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { scrollY } = useScroll();

  // Parallax effects for scroll
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

  // Auto-swipe effect for the cards
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROPERTIES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  if (showGate) {
    return <AccessCodeGate onGranted={onSecretAccess} onClose={() => setShowGate(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      
      {/* HEADER */}
      <header className="absolute top-0 inset-x-0 z-50 w-full pt-8 px-8 flex justify-between items-center max-w-[1400px] mx-auto">
        <SwipessLogo className="h-6 filter brightness-0 invert" style={{ filter: 'brightness(0) invert(1)' }} />
        <button 
          onClick={() => setShowGate(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all shadow-lg flex items-center gap-2"
        >
          Secret Code Access <Lock size={12} />
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E72A6F]/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-[1200px] mx-auto w-full flex flex-col lg:flex-row items-center gap-16">
          
          {/* Typography */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tighter mb-6">
                Swipe to find<br/>your <span className="text-[#E72A6F]">best deal.</span>
              </h1>
              <p className="text-lg lg:text-xl text-white/70 font-medium max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed">
                The exclusive ecosystem for trusted properties, experiences, and high-end services. All one swipe away.
              </p>
              <button 
                onClick={() => setShowGate(true)}
                className="bg-[#E72A6F] text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/20 transition-all"
              >
                Request Invitation
              </button>
            </motion.div>
          </div>

          {/* Center 3D Swiping Phone */}
          <div className="flex-1 flex justify-center relative perspective-1000">
            <motion.div 
              initial={{ opacity: 0, y: 50, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-[300px] h-[620px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-[#222] transform-gpu"
            >
              <div className="absolute top-0 inset-x-0 h-6 bg-black rounded-b-3xl w-32 mx-auto z-50"></div>
              
              <div className="w-full h-full bg-[#111] rounded-[2.2rem] overflow-hidden flex flex-col relative text-white">
                {/* Phone Header */}
                <div className="px-5 pt-12 pb-4 flex justify-between items-center z-40 relative">
                  <SwipessLogo className="h-4 filter invert opacity-90" />
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Search size={16} /></div>
                </div>

                {/* Swiping Cards Container */}
                <div className="flex-1 relative w-full h-full px-2 mt-4">
                  <AnimatePresence mode="popLayout">
                    {PROPERTIES.map((property, index) => {
                      if (index !== currentIndex) return null;
                      return (
                        <motion.div
                          key={property.id}
                          initial={{ scale: 0.95, opacity: 0, rotateZ: -5 }}
                          animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
                          exit={{ 
                            x: 300, 
                            rotateZ: 15, 
                            opacity: 0,
                            transition: { duration: 0.5, ease: 'easeIn' } 
                          }}
                          className="absolute inset-x-3 top-0 bottom-24 bg-[#222] rounded-3xl overflow-hidden shadow-2xl border border-white/10 origin-bottom-right"
                        >
                          <img src={property.image} className="w-full h-full object-cover" alt={property.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                          
                          {/* LIKE Stamp that fades in before exit */}
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: [0, 0, 1], scale: [0.5, 0.5, 1.2] }}
                            transition={{ duration: 3.5, times: [0, 0.8, 1] }} // Pops up right before card swipes
                            className="absolute top-10 left-8 border-4 border-green-500 text-green-500 text-4xl font-black uppercase tracking-widest px-4 py-2 rounded-xl rotate-[-15deg] bg-black/40 backdrop-blur-sm"
                          >
                            LIKE
                          </motion.div>

                          <div className="absolute bottom-6 left-5 right-5 text-white">
                            <h3 className="font-bold text-2xl mb-1 leading-tight">{property.title}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={12} className="text-pink-500" />
                              <span className="text-sm font-medium text-white/80">{property.location}</span>
                            </div>
                            <div className="font-black text-xl">{property.price} <span className="text-white/50 text-sm font-medium">/ mo</span></div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Phone Footer */}
                <div className="absolute bottom-0 w-full h-[80px] bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center pb-6 pt-3 z-40">
                  <Heart size={24} className="text-white/40 hover:text-white transition-colors" />
                  <div className="w-14 h-14 rounded-full border border-neutral-700 flex justify-center items-center -mt-10 bg-[#111] shadow-lg"><Plus size={24} className="text-pink-500"/></div>
                  <MessageSquare size={24} className="text-white/40 hover:text-white transition-colors" />
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* SCROLL EFFECTS SECTION */}
      <section className="py-32 px-6 relative max-w-[1400px] mx-auto min-h-[80vh] flex items-center border-t border-white/10">
        <div className="flex flex-col lg:flex-row items-center gap-20 w-full">
          
          <div className="flex-1 relative h-[500px] w-full">
            {/* Image sliding down on scroll */}
            <motion.div style={{ y: y1 }} className="absolute top-0 left-0 w-2/3 h-2/3 rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-10">
              <img src="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800" className="w-full h-full object-cover" alt="Yacht" />
              <div className="absolute inset-0 bg-black/20"></div>
            </motion.div>

            {/* Image sliding up on scroll */}
            <motion.div style={{ y: y2 }} className="absolute bottom-0 right-0 w-2/3 h-2/3 rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-20">
              <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800" className="w-full h-full object-cover" alt="Motorcycle" />
              <div className="absolute inset-0 bg-black/20"></div>
            </motion.div>
          </div>

          <div className="flex-1">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
              Curated for the <span className="text-[#E72A6F]">visionaries.</span>
            </h2>
            <p className="text-lg text-white/60 mb-10 leading-relaxed font-medium">
              We connect you with high-end properties, vehicles, and services that match your lifestyle. Zero hassle. 100% verified.
            </p>
            
            <div className="space-y-6">
              {[
                { title: 'Verified Ecosystem', icon: ShieldCheck },
                { title: 'Exclusive Deals', icon: Star },
                { title: 'Trusted Professionals', icon: CheckCircle },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center">
                    <item.icon size={24} />
                  </div>
                  <span className="text-lg font-bold">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/10 text-center text-white/40 text-sm font-medium">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <SwipessLogo className="h-4 filter invert opacity-50" style={{ filter: 'brightness(0) invert(1)' }} />
          <p>© 2026 Swipess. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
