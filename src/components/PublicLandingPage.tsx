import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mic, ArrowRight, MapPin, Heart, X, Shield, Zap, Globe, Ticket, Crown, CheckCircle2 } from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';
import { AccessCodeGate } from './AccessCodeGate';

const swipeCardsData = [
  { id: 1, title: 'Tulum Beach House', subtitle: '$400/night', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=600&q=80' },
  { id: 2, title: 'Luxury Yacht', subtitle: '$2,000/day', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80' },
  { id: 3, title: 'Pro Cleaner', subtitle: '$30/hour', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
  { id: 4, title: 'Full Moon Party', subtitle: '$50 Entry', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80' },
  { id: 5, title: 'Ducati Panigale', subtitle: '$150/day', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bfce94?auto=format&fit=crop&w=600&q=80' },
];

const changingWords = ['Properties', 'Yachts', 'Workers', 'Events', 'Motorcycles'];

interface PublicLandingPageProps {
  onSecretAccess: () => void;
}

const SwipeCard = ({ card, index, removeCard }: { card: any, index: number, removeCard: (id: number, action: 'like' | 'nope') => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      removeCard(card.id, 'like');
    } else if (info.offset.x < -100) {
      removeCard(card.id, 'nope');
    }
  };

  const isFront = index === 0;

  return (
    <motion.div
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        opacity: isFront ? opacity : 1,
        scale: isFront ? 1 : 1 - index * 0.05,
        y: isFront ? 0 : index * 10,
        zIndex: 10 - index,
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute top-0 left-0 w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-200"
      initial={false}
      animate={{ scale: isFront ? 1 : 1 - index * 0.05, y: isFront ? 0 : index * 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <img src={card.image} alt={card.title} className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h3 className="text-2xl font-bold">{card.title}</h3>
        <p className="text-lg opacity-90">{card.subtitle}</p>
      </div>

      {isFront && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 right-8 border-4 border-green-500 text-green-500 px-4 py-2 rounded-lg text-4xl font-black rotate-12 pointer-events-none"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 left-8 border-4 border-red-500 text-red-500 px-4 py-2 rounded-lg text-4xl font-black -rotate-12 pointer-events-none"
          >
            NOPE
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export function PublicLandingPage({ onSecretAccess }: PublicLandingPageProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [cards, setCards] = useState(swipeCardsData);
  const tapCount = useRef(0);
  const lastTap = useRef(0);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % changingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const removeCard = (id: number, action: 'like' | 'nope') => {
    setCards((prev) => prev.filter(c => c.id !== id));
    if (cards.length <= 1) {
      setTimeout(() => setCards(swipeCardsData), 500);
    }
  };

  const handleProgrammaticSwipe = (direction: 'left' | 'right') => {
    if (cards.length > 0) {
      removeCard(cards[0].id, direction === 'right' ? 'like' : 'nope');
    }
  };

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current > 5000) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }
    lastTapRef.current = now;

    if (tapCount + 1 >= 10) {
      onSecretAccess();
      setTapCount(0);
    }
  }, [tapCount, onSecretAccess]);

  const flyingVariants = {
    hidden: { opacity: 0, x: -200 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans overflow-x-hidden selection:bg-black selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <SwipessLogo className="h-8" />
          <nav className="hidden md:flex gap-8 font-medium">
            <a href="#" className="hover:text-neutral-500 transition-colors">Platform</a>
            <a href="#" className="hover:text-neutral-500 transition-colors">VIP</a>
            <a href="#" className="hover:text-neutral-500 transition-colors">Enterprise</a>
          </nav>
          <button onClick={() => setShowGate(true)} className="bg-black text-white px-6 py-2.5 rounded-full font-medium hover:bg-neutral-800 transition-colors">
            Get Access
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black leading-tight tracking-tight"
          >
            Swipe to find <br/> your best deal in
            <div className="text-black overflow-hidden h-[1.2em] relative mt-2">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {changingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-500 max-w-lg"
          >
            The premium network for high-end real estate, exclusive services, and curated experiences.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <button 
              onClick={() => handleProgrammaticSwipe('right')}
              className="bg-black text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              Start Swiping <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>

        <div className="flex-1 relative flex justify-center items-center">
          {/* Phone Mockup */}
          <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] p-4 shadow-2xl border-[8px] border-neutral-900 z-10">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-black rounded-b-3xl w-40 mx-auto z-20"></div>
            
            {/* Screen */}
            <div className="relative w-full h-full bg-neutral-100 rounded-[2rem] overflow-hidden flex flex-col">
              <div className="flex-1 relative">
                <AnimatePresence>
                  {cards.slice(0, 3).map((card, i) => (
                    <SwipeCard key={card.id} card={card} index={i} removeCard={removeCard} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="h-24 bg-white flex justify-center items-center gap-6 pb-2">
                <button onClick={() => handleProgrammaticSwipe('left')} className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex justify-center items-center shadow-sm hover:bg-red-200 transition-colors">
                  <X size={28} />
                </button>
                <button onClick={() => handleProgrammaticSwipe('right')} className="w-14 h-14 bg-green-100 text-green-500 rounded-full flex justify-center items-center shadow-sm hover:bg-green-200 transition-colors">
                  <Heart size={28} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
          {/* Background decorative blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl z-0"></div>
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/4 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl z-0"></div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-32 bg-neutral-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <motion.div
            variants={flyingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "-100px" }}
          >
            <h2 className="text-4xl lg:text-6xl font-black mb-4">Curated Events</h2>
            <p className="text-xl text-neutral-400">Exclusive access to global happenings.</p>
          </motion.div>
        </div>
        <div className="flex gap-6 px-6 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar">
          {[
            { title: 'Full Moon Beach Party', loc: 'Tulum', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80' },
            { title: 'Art Basel Exclusive', loc: 'Miami', img: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&w=600&q=80' },
            { title: 'Yacht Week Finale', loc: 'Croatia', img: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80' },
            { title: 'Underground Tech', loc: 'Berlin', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' },
          ].map((event, i) => (
            <motion.div
              key={i}
              variants={flyingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-100px" }}
              className="min-w-[300px] md:min-w-[400px] h-[500px] rounded-3xl overflow-hidden relative snap-center flex-shrink-0 group"
            >
              <img src={event.img} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                <span className="bg-white/20 backdrop-blur-md text-white w-fit px-3 py-1 rounded-full text-sm font-medium mb-3 flex items-center gap-1"><MapPin size={14}/> {event.loc}</span>
                <h3 className="text-3xl font-bold">{event.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VIP Card Section */}
      <section className="py-32 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-20">
          <motion.div 
            variants={flyingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "-100px" }}
            className="flex-1"
          >
            <h2 className="text-4xl lg:text-6xl font-black mb-6">The Swipess VIP</h2>
            <p className="text-xl text-neutral-500 mb-8 leading-relaxed">
              Unlock unparalleled access. Flash your digital Swipess card at partner venues globally for line-skips, exclusive menus, and private lounge access.
            </p>
            <ul className="space-y-4">
              {['Priority matching on all assets', 'Zero service fees on bookings', '24/7 dedicated concierge'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium">
                  <CheckCircle2 className="text-blue-600" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div 
            variants={flyingVariants}
            initial={{ opacity: 0, x: 200 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-100px" }}
            className="flex-1 relative h-[400px] flex justify-center items-center"
          >
            {/* The VIP Card */}
            <motion.div 
              whileHover={{ rotateY: 15, rotateX: 10, scale: 1.05 }}
              className="w-full max-w-[400px] h-[250px] bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-neutral-800 z-10 perspective-1000"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex justify-between items-start relative z-10">
                <SwipessLogo className="h-6 opacity-80 filter invert" />
                <Crown className="text-yellow-500" size={32} />
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <div className="text-sm tracking-[0.2em] text-neutral-400 mb-1">VIP MEMBER</div>
                <div className="text-2xl font-mono tracking-widest">ALEJANDRO V.</div>
              </div>
            </motion.div>
            
            {/* Flying Icons around card */}
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl z-20">
              <Ticket className="text-purple-600" size={32} />
            </motion.div>
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl z-20">
              <Shield className="text-blue-600" size={32} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTEL CORE AI Section */}
      <section className="py-32 bg-black text-white relative border-y border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            variants={flyingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "-100px" }}
          >
            <div className="flex items-center justify-center gap-3 mb-12">
              <Zap className="text-blue-500" size={24} />
              <h2 className="text-xl md:text-2xl font-mono tracking-widest text-neutral-400">
                INTEL CORE / INITIALIZE SEARCH PARAMETERS
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {['PROPERTIES', 'WORKERS', 'MOTORCYCLES', 'BICYCLES', 'YACHTS', 'BUYERS', 'RENTERS', 'SEEKERS'].map((cat, i) => (
                <button key={i} className="py-4 rounded-full border border-neutral-800 bg-neutral-900/50 hover:bg-white hover:text-black hover:border-white transition-all font-mono text-sm tracking-widest">
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative max-w-3xl mx-auto">
              <input 
                type="text" 
                placeholder="Inquire for discovery..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-6 pl-8 pr-32 text-xl font-mono focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <button className="w-12 h-12 rounded-full bg-neutral-800 flex justify-center items-center hover:bg-neutral-700 transition-colors">
                  <Mic size={20} />
                </button>
                <button className="w-12 h-12 rounded-full bg-white text-black flex justify-center items-center hover:bg-neutral-200 transition-colors">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Global Map Section */}
      <section className="py-32 bg-neutral-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10">
          <motion.div
             variants={flyingVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ margin: "-100px" }}
          >
            <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 flex items-center justify-center gap-4">
              <Globe className="text-blue-500" size={48} /> Global Presence
            </h2>
            <p className="text-2xl text-neutral-400 font-light">
              Discover Mykonos, Ibiza, Paris, Tulum.
            </p>
          </motion.div>
        </div>
        
        <div className="w-full h-[60vh] relative">
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=80" 
            alt="Global Map" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent"></div>
          
          {/* Glowing Pins */}
          {[
            { top: '30%', left: '45%' }, // Paris
            { top: '40%', left: '50%' }, // Ibiza
            { top: '45%', left: '55%' }, // Mykonos
            { top: '50%', left: '25%' }, // Tulum
          ].map((pos, i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ margin: "-50px" }}
              transition={{ delay: i * 0.2, type: 'spring' }}
              className="absolute flex justify-center items-center"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping absolute opacity-50"></div>
              <MapPin className="text-blue-500 relative z-10" fill="currentColor" size={32} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer & Secret Backdoor */}
      <footer className="bg-[#111] text-neutral-500 py-12 relative border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <SwipessLogo className="h-6 opacity-50 grayscale" />
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm">© 2026 Swipess. All rights reserved.</p>
        </div>

        {/* SECRET BACKDOOR */}
        <div 
          onClick={handleSecretTap}
          className="absolute bottom-4 right-4 text-[10px] text-neutral-800 hover:text-neutral-600 cursor-pointer select-none flex items-center gap-1 transition-colors z-50 p-4"
        >
          <Shield size={10} />
          Tap this corner 10 times For private access
        </div>
      </footer>

      {showGate && (
        <AccessCodeGate 
          onGranted={onSecretAccess} 
          onClose={() => setShowGate(false)} 
        />
      )}
    </div>
  );
}
