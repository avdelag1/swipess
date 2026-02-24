import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { logger } from "@/utils/prodLogger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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
      {/* Cinematic Noise Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated background */}
      <div className="absolute inset-0 opacity-30" style={{
        willChange: 'opacity',
        contain: 'layout style paint'
      }}>
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
          Lost in the Swipe?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 text-lg"
        >
          This page doesn't exist or has been moved.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-400"
        >
          Tried to access: <code className="bg-white/10 px-2 py-1 rounded text-orange-400">{location.pathname}</code>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 pt-4"
        >
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-semibold shadow-lg"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Button>
          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Clear Cache & Reload
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-gray-500 pt-4"
        >
          If you keep seeing this, try the clear cache button above.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
