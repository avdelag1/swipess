import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, Search, Compass, MessageCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { logger } from "@/utils/prodLogger";
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '@/hooks/useSiteContent';

const SUGGESTED_PAGES = [
  { label: 'Explore Properties', path: '/client/dashboard', icon: Compass },
  { label: 'My Likes', path: '/client/liked-properties', icon: Heart },
  { label: 'Messages', path: '/messages', icon: MessageCircle },
  { label: 'Find Services', path: '/client/services', icon: Search },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getText } = useSiteContent('errors');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Subtle parallax on the floating cards
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handleClearCache = async () => {
    // Clear service worker cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Hard reload
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden relative" style={{
      contain: 'layout style paint'
    }}>
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20" style={{
        contain: 'layout style paint'
      }}>
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, rgba(249, 115, 22, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Floating swipe cards in background */}
      <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1000px' }}>
        {/* Ghost card 1 — tilted left */}
        <motion.div
          className="absolute w-48 h-72 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-sm"
          style={{
            top: '15%',
            left: '8%',
            transform: `rotate(-12deg) translateX(${mousePos.x * 0.3}px) translateY(${mousePos.y * 0.3}px)`,
          }}
          animate={{ y: [0, -15, 0], rotate: [-12, -10, -12] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="h-3 w-20 rounded bg-white/[0.08] mb-2" />
              <div className="h-2 w-14 rounded bg-white/[0.05]" />
            </div>
          </div>
        </motion.div>

        {/* Ghost card 2 — tilted right */}
        <motion.div
          className="absolute w-40 h-60 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-orange-500/[0.04] to-transparent backdrop-blur-sm"
          style={{
            bottom: '20%',
            right: '10%',
            transform: `rotate(8deg) translateX(${mousePos.x * -0.2}px) translateY(${mousePos.y * -0.2}px)`,
          }}
          animate={{ y: [0, 12, 0], rotate: [8, 10, 8] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex-1 h-[1.5px] rounded-full bg-white/[0.08]" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Ghost card 3 — small, subtle */}
        <motion.div
          className="absolute w-32 h-48 rounded-2xl border border-white/[0.04] bg-gradient-to-br from-rose-500/[0.03] to-transparent hidden md:block"
          style={{
            top: '55%',
            left: '18%',
            transform: `rotate(5deg) translateX(${mousePos.x * 0.15}px) translateY(${mousePos.y * 0.15}px)`,
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 p-8 max-w-md relative z-10"
      >
        {/* 404 Text */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative"
        >
          <motion.div
            className="text-9xl font-black"
            style={{
              background: 'linear-gradient(90deg, #f97316, #ea580c, #fbbf24, #ff6b35, #dc2626)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              WebkitTextStroke: '2px rgba(249, 115, 22, 0.3)',
              textShadow: '0 0 40px rgba(249, 115, 22, 0.5)',
              filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.4))',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '200% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            404
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white"
        >
          {getText('not_found_title', 'This One Got Swiped Away')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 text-lg"
        >
          {t('errors.pageNotFoundDesc', "The page you're looking for has moved, been removed, or never existed.")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-400"
        >
          Tried to access: <code className="bg-white/10 px-2 py-1 rounded text-orange-400">{location.pathname}</code>
        </motion.p>

        {/* Quick navigation suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-2 gap-2"
        >
          {SUGGESTED_PAGES.map((page, idx) => (
            <motion.button
              key={page.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + idx * 0.06 }}
              onClick={() => navigate(page.path)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white transition-all active:scale-95"
            >
              <page.icon className="w-4 h-4 text-orange-400/70" />
              <span className="truncate">{page.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 pt-2"
        >
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-semibold shadow-lg"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            {t('errors.goHome')}
          </Button>
          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {getText('retry_button', 'Clear Cache & Reload')}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-gray-500 pt-4"
        >
          {getText('network_error', 'If you keep seeing this, try the clear cache button above.')}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
