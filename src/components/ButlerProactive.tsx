import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Info } from 'lucide-react';
import { haptics } from '@/utils/microPolish';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Page descriptions for new users
const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/client/dashboard': "Discovery: Swipe Right on properties, motorcycles, or services you like. We'll find your perfect match using smart AI analysis.",
  '/owner/dashboard': "Owner Hub: Manage your listings and see which clients are currently interested in your offers. Real-time matching is active.",
  '/client/profile': "Your Profile: A complete profile with great photos increases your match rate by 300%. Tell owners who you are!",
  '/owner/profile': "Owner Profile: Build trust with potential clients. Verification and detailed business info help you close deals faster.",
  '/messages': "Messages: All your successful matches will appear here. Start a conversation to finalize your rental or purchase.",
  '/notifications': "Activity: Stay updated on who liked you, new matches, and important platform announcements.",
  '/explore/eventos': "Events: Discover what's happening around you. From beach parties to professional meetups, find your vibe here.",
  '/client/liked-properties': "Liked Items: This is your curated list of favorites. You can organize them or directly message owners from here.",
  '/owner/properties': "My Listings: Review and edit your active offers. Keep prices updated to stay at the top of client searches.",
  '/client/filters': "Smart Filters: Narrow down your search by category, price, and location to find exactly what you need in seconds.",
  '/subscription-packages': "Premium: Unlock God-Mode for unlimited swipes, priority matching, and exclusive AI insights.",
  '/radio': "Swipess Radio: Tune into local beats and curated playlists while you browse. The ultimate vibe.",
  '/explore/roommates': "Roommates: Looking for someone to share a space? Find compatible partners based on lifestyle and interests.",
};

export function ButlerProactive() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const location = useLocation();
  const { user } = useAuth();

  // Determine if we should show the "Page Intro" banner
  useEffect(() => {
    if (!user) {
      setIsVisible(false);
      return;
    }

    // 1. Check if user is "new" (e.g., created within the last 14 days)
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    if (ageMs > fourteenDaysMs) {
      setIsVisible(false);
      return;
    }

    // 2. Normalize path and find description
    const path = location.pathname;
    const description = PAGE_DESCRIPTIONS[path];

    if (!description) {
      setIsVisible(false);
      return;
    }

    // 3. Check if user already saw this page description in this session
    // The user said "if I come back... I'm not going to see it anymore"
    // Using sessionStorage for "per session" or localStorage for "forever"
    // The user said "it's just one time", implying they don't want to see it again.
    const storageKey = `swipess_page_intro_seen_${path}_${user.id}`;
    const hasSeen = localStorage.getItem(storageKey);

    if (hasSeen) {
      setIsVisible(false);
      return;
    }

    // 4. Show the banner with a slight delay
    const timer = setTimeout(() => {
      setCurrentMessage(description);
      setIsVisible(true);
      // Automatically mark as seen so it doesn't show again
      localStorage.setItem(storageKey, 'true');
    }, 1500);

    return () => clearTimeout(timer);
  }, [location.pathname, user]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-4 right-4 z-[100] pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            <div className={cn(
              "relative overflow-hidden rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-brand-accent-2/20",
              "bg-black/80 backdrop-blur-3xl border-white/10"
            )}>
              {/* Dynamic Gradient Background */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent-2/10 blur-3xl rounded-full" />
              
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent-2/15 flex items-center justify-center flex-shrink-0 border border-brand-accent-2/30">
                  <Info className="w-6 h-6 text-brand-accent-2" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Page Presentation
                    </span>
                    <button 
                      onClick={() => { haptics.tap(); setIsVisible(false); }}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                  
                  <p className="text-[13px] font-bold leading-relaxed text-white/95">
                    {currentMessage}
                  </p>
                  
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => { haptics.success(); setIsVisible(false); }}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-accent-2 hover:text-white transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
