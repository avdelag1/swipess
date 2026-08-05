import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, X, Search, Star, CheckCircle, MapPin, 
  Briefcase, Bike, Home, Anchor, Calendar, FileText, Bot, CreditCard,
  ChefHat, Apple, Grip, Hammer, Smartphone, ChevronRight
} from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';

interface PublicLandingPageProps {
  onSecretAccess: () => void;
}

export default function PublicLandingPage({ onSecretAccess }: PublicLandingPageProps) {
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current > 5000) {
      tapCountRef.current = 0;
    }
    lastTapTimeRef.current = now;
    tapCountRef.current += 1;
    if (tapCountRef.current >= 10) {
      tapCountRef.current = 0;
      onSecretAccess();
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#fdfdfd', color: '#111', overflowX: 'hidden' }}>
      <style>
        {`
          .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.05);
          }
          .phone-mockup {
            width: 300px;
            height: 600px;
            background: #fff;
            border-radius: 40px;
            border: 12px solid #222;
            overflow: hidden;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          .phone-notch {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 120px;
            height: 25px;
            background: #222;
            border-bottom-left-radius: 16px;
            border-bottom-right-radius: 16px;
            z-index: 10;
          }
          .grid-layout {
            display: grid;
            gap: 1.5rem;
          }
          .hover-scale {
            transition: transform 0.3s ease;
          }
          .hover-scale:hover {
            transform: translateY(-5px);
          }
          .gradient-overlay {
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
          }
          .vip-card {
            background: linear-gradient(135deg, #222 0%, #000 100%);
            border-radius: 20px;
            color: white;
            padding: 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .vip-card::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: skewX(-20deg);
            animation: shine 5s infinite;
          }
          @keyframes shine {
            0% { left: -100%; }
            20% { left: 200%; }
            100% { left: 200%; }
          }
        `}
      </style>

      {/* Navigation */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(253,253,253,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SwipessLogo variant="black" className="w-8 h-8 mr-2" />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>SWIPESS</span>
          </div>
          
          <div className="desktop-nav" style={{ display: 'flex', gap: '24px', fontWeight: 500, fontSize: '0.95rem' }}>
            <a href="#" style={{ textDecoration: 'none', color: '#111' }}>Home</a>
            <a href="#" style={{ textDecoration: 'none', color: '#555' }}>Categories</a>
            <a href="#" style={{ textDecoration: 'none', color: '#555' }}>For Locals</a>
            <a href="#" style={{ textDecoration: 'none', color: '#555' }}>For Professionals</a>
            <a href="#" style={{ textDecoration: 'none', color: '#555' }}>How it works</a>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button style={{ background: '#111', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer' }}>
              Get Early Access
            </button>
            <Menu style={{ display: 'none', cursor: 'pointer' }} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: '60px auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <motion.div initial="hidden" whileInView="visible" variants={fadeUp} style={{ flex: '1 1 400px' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
            Your world.<br/>Your people.<br/>
            <span style={{ color: '#e83e8c' }}>Your way.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#555', marginBottom: '32px', maxWidth: '480px', lineHeight: 1.6 }}>
            The all-in-one app to discover trusted people, services, experiences and opportunities wherever life takes you.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600 }}>
              <Smartphone size={20} /> App Store
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 600 }}>
              <Smartphone size={20} /> Google Play
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#888', fontWeight: 500 }}>
            🔒 Private Access - Invitation Code Required
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at center, #fce4ec 0%, transparent 70%)', zIndex: -1, top: '-10%', left: '10%' }}></div>
          
          <div className="phone-mockup">
            <div className="phone-notch"></div>
            <img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80" alt="People having fun" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Inner Phone UI overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
              <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.5rem' }}>Miami Beach Meetup</h3>
              <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>Join 24 others locally</p>
            </div>
          </div>

          <div className="glass-card" style={{ position: 'absolute', bottom: '10%', left: '-10%', padding: '16px', width: '260px', zIndex: 10 }}>
            <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '8px' }}>
              <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
            </div>
            <p style={{ fontSize: '0.9rem', margin: '0 0 8px 0', fontStyle: 'italic' }}>"Swipess makes it easy to find amazing people..."</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
              <CheckCircle size={14} color="#10b981" /> Verified Member
            </div>
          </div>
        </motion.div>
      </section>

      {/* Categories Nav */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <motion.div initial="hidden" whileInView="visible" variants={fadeUp} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', overflowX: 'auto', gap: '32px' }}>
          {[
            { icon: Briefcase, label: 'Workers' },
            { icon: Bike, label: 'Bikes' },
            { icon: Home, label: 'Properties' },
            { icon: Anchor, label: 'Yachts' },
            { icon: Calendar, label: 'Events' },
            { icon: FileText, label: 'Legal' },
            { icon: Bot, label: 'AI Assistant' },
            { icon: CreditCard, label: 'VIP Card' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '80px', cursor: 'pointer' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <item.icon size={24} color="#333" />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#444' }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Workers Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>Trusted people,<br/>real services.</h2>
            <button style={{ background: '#e83e8c', color: 'white', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Explore Workers
            </button>
          </div>
          <div style={{ flex: '2 1 600px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Chef Maria', rating: '4.9', img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80', loc: 'Miami, FL' },
              { name: 'Cleaning Pro', rating: '4.8', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80', loc: 'Brickell' },
              { name: 'Massage Ther.', rating: '5.0', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80', loc: 'South Beach' },
              { name: 'Handyman', rating: '4.7', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80', loc: 'Downtown' }
            ].map((worker, idx) => (
              <motion.div key={idx} variants={fadeUp} initial="hidden" whileInView="visible" className="hover-scale" style={{ height: '240px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                <img src={worker.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={worker.name} />
                <div className="gradient-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', color: 'white' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{worker.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#eee' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} color="#fbbf24" fill="#fbbf24" /> {worker.rating}</span>
                    <span>{worker.loc}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            <div style={{ background: '#f5f5f5', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>
              +25 more services
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px', background: '#fafafa', borderRadius: '32px', paddingTop: '60px', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>Move and explore<br/>with ease.</h2>
            <button style={{ background: '#8b5cf6', color: 'white', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              View Vehicles
            </button>
          </div>
          <div style={{ flex: '2 1 600px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            {[
              { title: 'Beach Cruiser', price: '$20/day', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80', loc: 'South Beach' },
              { title: 'Yamaha FZ 25', price: '$45/day', img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80', loc: 'Downtown' },
              { title: 'Honda PCX', price: '$35/day', img: 'https://images.unsplash.com/photo-1621214023775-6b80d0d8294a?auto=format&fit=crop&w=400&q=80', loc: 'Wynwood' },
              { title: 'Electric Bike', price: '$25/day', img: 'https://images.unsplash.com/photo-1572334005072-4687d98eeec1?auto=format&fit=crop&w=400&q=80', loc: 'Brickell' }
            ].map((v, idx) => (
              <motion.div key={idx} variants={fadeUp} initial="hidden" whileInView="visible" className="hover-scale glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                  <img src={v.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={v.title} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{v.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 600, color: '#8b5cf6' }}>{v.price}</span>
                  <span>{v.loc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px' }}>Stay, invest or rent.</h2>
        <button style={{ background: '#d97706', color: 'white', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, cursor: 'pointer', marginBottom: '40px' }}>
          Explore Properties
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { title: 'Modern Villa', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', tag: 'For Rent' },
            { title: 'Oceanview Apt', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', tag: 'For Sale' },
            { title: 'Downtown Loft', img: 'https://images.unsplash.com/photo-1502672260266-1c1e52d1590c?auto=format&fit=crop&w=800&q=80', tag: 'Investment' }
          ].map((prop, idx) => (
            <motion.div key={idx} variants={fadeUp} initial="hidden" whileInView="visible" className="hover-scale" style={{ height: '300px', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
              <img src={prop.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={prop.title} />
              <div className="gradient-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', color: 'white' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(4px)', marginBottom: '12px', display: 'inline-block' }}>{prop.tag}</span>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{prop.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mixed Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ height: '320px', borderRadius: '24px', position: 'relative', overflow: 'hidden', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>
            <h3 style={{ position: 'relative', zIndex: 2, color: 'white', fontSize: '2rem', fontWeight: 800, margin: 0 }}>Events that bring<br/>people together.</h3>
            <button style={{ position: 'relative', zIndex: 2, background: 'white', color: 'black', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, width: 'fit-content', cursor: 'pointer' }}>Explore Events</button>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ height: '320px', borderRadius: '24px', position: 'relative', overflow: 'hidden', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1 }}></div>
            <h3 style={{ position: 'relative', zIndex: 2, color: 'white', fontSize: '2rem', fontWeight: 800, margin: 0 }}>Legal services<br/>made simple.</h3>
            <button style={{ position: 'relative', zIndex: 2, background: 'white', color: 'black', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, width: 'fit-content', cursor: 'pointer' }}>Find a Lawyer</button>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ height: '320px', borderRadius: '24px', background: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)', position: 'relative', overflow: 'hidden', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '300px', height: '300px', background: '#a78bfa', filter: 'blur(80px)', opacity: 0.5, borderRadius: '50%' }}></div>
            <h3 style={{ position: 'relative', zIndex: 2, color: 'white', fontSize: '2rem', fontWeight: 800, margin: 0 }}>AI Assistant<br/>that works for you.</h3>
            <button style={{ position: 'relative', zIndex: 2, background: 'white', color: '#4c1d95', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 600, width: 'fit-content', cursor: 'pointer' }}>Ask AI</button>
          </motion.div>

        </div>
      </section>

      {/* VIP Card Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '40px', textAlign: 'center' }}>VIP Card. Your digital ID.</h2>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ flex: '1 1 400px' }}>
            <div className="vip-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <SwipessLogo variant="white" className="w-10 h-10" />
                <span style={{ letterSpacing: '2px', fontWeight: 600, color: '#e83e8c' }}>VIP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 600 }}>Alejandro Villarreal</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
                    <CheckCircle size={16} /> Verified Member
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '1px' }}>MEMBER SINCE 2024</div>
                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '4px' }}></div> {/* QR Placeholder */}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Verified Documents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {['Passport', 'ID Card', 'Driver License', 'Lease Agreement'].map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f5f5f5', borderRadius: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span style={{ fontWeight: 500, color: '#333' }}>{doc}</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}><Star size={18} color="#fbbf24" /> Local Discounts</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}><Calendar size={18} color="#8b5cf6" /> Exclusive Events</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}><CheckCircle size={18} color="#10b981" /> Trusted Member</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>+ More Benefits</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#111', color: 'white', padding: '80px 24px 24px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <SwipessLogo variant="white" className="w-8 h-8 mr-2" />
                <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>SWIPESS</span>
              </div>
              <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '32px' }}>One app. Infinite possibilities.</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ background: 'white', color: 'black', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600 }}>App Store</button>
                <button style={{ background: 'white', color: 'black', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600 }}>Google Play</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Company</h4>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>About</a>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Careers</a>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Press</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Support</h4>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Help Center</a>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Safety</a>
                <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Terms of Service</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#666' }}>
            <span>© 2024 Swipess Inc. All rights reserved.</span>
            
            {/* SECRET BACKDOOR */}
            <div 
              onClick={handleSecretTap}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.3, userSelect: 'none' }}
              title="Tap 10 times quickly"
            >
              <span>Tap this corner 10 times For private access</span>
              <Bot size={14} />
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
