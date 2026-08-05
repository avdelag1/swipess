import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Car, Ship, Users, CalendarDays, Scale, Bot, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import SwipessLogo from '@/components/SwipessLogo';
import LandingBackgroundEffects from '@/components/LandingBackgroundEffects';

interface PublicLandingPageProps {
  onSecretAccess: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' as const },
  transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  },
  viewport: { once: true, margin: '-50px' as const }
};

const fadeItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function PublicLandingPage({ onSecretAccess }: PublicLandingPageProps) {
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTime.current > 5000) {
      clickCount.current = 1;
    } else {
      clickCount.current += 1;
    }
    lastClickTime.current = now;

    if (clickCount.current >= 10) {
      onSecretAccess();
      clickCount.current = 0;
    }
  }, [onSecretAccess]);

  return (
    <div className="swp-container">
      <style>{`
        .swp-container {
          background-color: #0a0a0b;
          color: #ffffff;
          min-height: 100vh;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow-x: hidden;
          position: relative;
        }
        
        .swp-accent { color: #c9a55a; }
        .swp-bg-accent { background-color: #c9a55a; }
        
        .swp-glass {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
        }

        .swp-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          z-index: 10;
        }

        .swp-hero h1 {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 2rem 0 1rem;
          max-width: 900px;
        }

        .swp-hero p {
          font-size: clamp(1.1rem, 2vw, 1.3rem);
          color: #a0a0a5;
          max-width: 600px;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .swp-store-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #111112;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .swp-store-btn:hover {
          background: #1a1a1c;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .swp-store-btn svg { width: 24px; height: 24px; fill: currentColor; }

        .swp-categories {
          padding: 6rem 2rem;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .swp-cat-scroll {
          display: flex;
          gap: 2rem;
          overflow-x: auto;
          padding: 2rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-snap-type: x mandatory;
        }
        .swp-cat-scroll::-webkit-scrollbar { display: none; }

        .swp-cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          min-width: 120px;
          scroll-snap-align: center;
        }

        .swp-cat-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(201, 165, 90, 0.3);
          background: rgba(201, 165, 90, 0.05);
          color: #c9a55a;
          transition: all 0.3s ease;
        }

        .swp-cat-item:hover .swp-cat-icon {
          background: rgba(201, 165, 90, 0.15);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(201, 165, 90, 0.2);
        }

        .swp-features {
          padding: 6rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .swp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .swp-feature-card {
          padding: 2.5rem;
          position: relative;
          overflow: hidden;
        }

        .swp-feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 20px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(201, 165, 90, 0.5), transparent, transparent, rgba(201, 165, 90, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .swp-ai-section {
          padding: 8rem 2rem;
          text-align: center;
          background: radial-gradient(circle at center, rgba(201, 165, 90, 0.05) 0%, transparent 70%);
        }

        .swp-bullets {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .swp-bullet {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          font-size: 0.95rem;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .swp-comparison {
          padding: 6rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .swp-comp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }

        @media (max-width: 768px) {
          .swp-comp-grid { grid-template-columns: 1fr; }
        }

        .swp-comp-col { padding: 2rem; border-radius: 20px; }
        .swp-comp-others { background: rgba(255, 50, 50, 0.03); border: 1px solid rgba(255, 50, 50, 0.1); }
        .swp-comp-us { background: rgba(201, 165, 90, 0.05); border: 1px solid rgba(201, 165, 90, 0.2); }
        
        .swp-comp-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        }

        .swp-invite-code {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin: 2rem 0;
        }

        .swp-code-box {
          width: 40px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
          border: 1px solid rgba(201, 165, 90, 0.4);
          border-radius: 8px;
          background: rgba(0,0,0,0.5);
          color: #c9a55a;
        }

        .swp-footer {
          padding: 4rem 2rem 2rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

      {/* Hero Section */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', zIndex: 0, overflow: 'hidden' }}>
        <LandingBackgroundEffects mode="stars" />
      </div>
      
      <section className="swp-hero">
        <motion.div {...fadeUp} style={{ marginBottom: '2rem' }}>
          <SwipessLogo size="3xl" variant="transparent" />
        </motion.div>
        
        <motion.h1 {...fadeUp} transition={{ delay: 0.1 }}>
          One App. Everything.<br />
          <span className="swp-accent">You Have Full Control.</span>
        </motion.h1>
        
        <motion.p {...fadeUp} transition={{ delay: 0.2 }}>
          Access the world's best experiences, services, professionals and opportunities.<br />
          All in one private ecosystem.
        </motion.p>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="https://apps.apple.com/app/swipess" className="swp-store-btn">
            <svg viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Download on the</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>App Store</div>
            </div>
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.swipess" className="swp-store-btn">
            <svg viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>GET IT ON</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Google Play</div>
            </div>
          </a>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.5 }} style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          🔒 Private Access — Invitation Code Required
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="swp-categories">
        <motion.h2 {...fadeUp} style={{ fontSize: '1.2rem', letterSpacing: '0.1em', color: '#c9a55a', marginBottom: '3rem' }}>
          EVERYTHING YOU NEED. PEOPLE YOU TRUST.
        </motion.h2>
        
        <motion.div className="swp-cat-scroll" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }}>
          {[
            { icon: Building2, label: "Properties" },
            { icon: Car, label: "Vehicles" },
            { icon: Ship, label: "Yachts & Jets" },
            { icon: Users, label: "Workers" },
            { icon: CalendarDays, label: "Events" },
            { icon: Scale, label: "Legal" },
            { icon: Bot, label: "AI Assistant" },
            { icon: CreditCard, label: "VIP Card" },
          ].map((cat, i) => (
            <motion.div key={i} className="swp-cat-item" variants={fadeItem}>
              <div className="swp-cat-icon">
                <cat.icon size={36} />
              </div>
              <span style={{ fontWeight: 500 }}>{cat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="swp-features">
        <motion.h2 {...fadeUp} style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>
          Real People. Real Services.
        </motion.h2>
        
        <div className="swp-grid">
          <motion.div className="swp-glass swp-feature-card" {...fadeUp} transition={{ delay: 0.1 }}>
            <Building2 size={40} className="swp-accent" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your Assets, Your Rules</h3>
            <p style={{ color: '#a0a0a5', lineHeight: 1.6 }}>Properties, vehicles, yachts. Direct connection. Zero middlemen fees inflating the cost.</p>
          </motion.div>
          
          <motion.div className="swp-glass swp-feature-card" {...fadeUp} transition={{ delay: 0.2 }}>
            <Users size={40} className="swp-accent" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Promote Your Skills</h3>
            <p style={{ color: '#a0a0a5', lineHeight: 1.6 }}>Find clients or hire elite talent instantly. A direct, vetted network for professionals.</p>
          </motion.div>
          
          <motion.div className="swp-glass swp-feature-card" {...fadeUp} transition={{ delay: 0.3 }}>
            <CreditCard size={40} className="swp-accent" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>The Key to the City</h3>
            <p style={{ color: '#a0a0a5', lineHeight: 1.6 }}>Unlock VIP Cards for exclusive events, massive discounts, and priority access globally.</p>
          </motion.div>
        </div>
      </section>

      {/* AI Section */}
      <section className="swp-ai-section">
        <motion.div {...fadeUp}>
          <Bot size={60} className="swp-accent" style={{ margin: '0 auto 2rem' }} />
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>AI THAT WORKS FOR YOU.</h2>
          <p style={{ color: '#a0a0a5', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
            Our AI understands what you need, connects you to the right people, and gets things done faster than ever.
          </p>
        </motion.div>
        
        <motion.div className="swp-bullets" variants={staggerContainer} initial="initial" whileInView="whileInView">
          {["Smart recommendations", "Real-time matching", "Personalized results", "Saves you time and money"].map((text, i) => (
            <motion.div key={i} className="swp-bullet" variants={fadeItem}>
              <CheckCircle2 size={18} className="swp-accent" />
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* VIP Card Section */}
      <section className="swp-ai-section" style={{ background: 'none', padding: '4rem 2rem' }}>
        <motion.div {...fadeUp}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#c9a55a' }}>VIP CARD. UNLOCK MORE.</h2>
        </motion.div>
        
        <motion.div className="swp-bullets" variants={staggerContainer} initial="initial" whileInView="whileInView">
          {["Exclusive Access", "Priority Service", "Special Benefits", "Personal Concierge", "Global Network"].map((text, i) => (
            <motion.div key={i} className="swp-bullet" variants={fadeItem} style={{ background: 'rgba(201, 165, 90, 0.1)', borderColor: 'rgba(201, 165, 90, 0.3)', color: '#c9a55a' }}>
              <CreditCard size={18} />
              <span style={{ fontWeight: 600 }}>{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Comparison Section */}
      <section className="swp-comparison">
        <motion.h2 {...fadeUp} style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
          WHY SWIPESS?
        </motion.h2>
        
        <div className="swp-comp-grid">
          <motion.div className="swp-comp-col swp-comp-others" {...fadeUp} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '2rem', color: '#ff6b6b' }}>THE OLD WAY</h3>
            {[
              "Hidden fees inflating costs",
              "Unnecessary middlemen",
              "Limited, biased options",
              "Slow responses and friction",
              "No personal touch or privacy"
            ].map((text, i) => (
              <div key={i} className="swp-comp-item">
                <XCircle size={24} color="#ff6b6b" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div className="swp-comp-col swp-comp-us" {...fadeUp} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '2rem', color: '#c9a55a' }}>SWIPESS</h3>
            {[
              "No hidden fees or markups",
              "Direct P2P connections",
              "Unlimited premium options",
              "Fast, reliable AI matching",
              "Personal & completely private"
            ].map((text, i) => (
              <div key={i} className="swp-comp-item">
                <CheckCircle2 size={24} className="swp-accent" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="swp-hero" style={{ minHeight: '60vh' }}>
        <motion.h2 {...fadeUp} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          READY TO TAKE CONTROL?
        </motion.h2>
        <motion.p {...fadeUp} style={{ color: '#a0a0a5', fontSize: '1.2rem', marginBottom: '3rem' }}>
          Join Swipess and unlock a world of possibilities.
        </motion.p>
        
        <motion.div {...fadeUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
          <a href="https://apps.apple.com/app/swipess" className="swp-store-btn">
             <svg viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Download on the</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>App Store</div>
            </div>
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.swipess" className="swp-store-btn">
             <svg viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>GET IT ON</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Google Play</div>
            </div>
          </a>
        </motion.div>

        <motion.div {...fadeUp} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.9rem', color: '#a0a0a5', marginBottom: '1rem' }}>Enter your invitation code to join</div>
          <div className="swp-invite-code">
            {['S','W','I','P','E','S','S'].map((letter, i) => (
              <div key={i} className="swp-code-box">{letter}</div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
            🔒 Private Access — Invitation Code Required
          </div>
        </motion.div>
      </section>

      {/* Footer / Backdoor */}
      <footer className="swp-footer">
        <p 
          onClick={handleSecretClick}
          style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', cursor: 'default', userSelect: 'none' }}
        >
          © {new Date().getFullYear()} Swipess. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
