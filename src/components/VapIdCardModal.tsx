import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MapPin, Sparkles, ScanLine, XCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface VapIdProps {
  isOpen: boolean;
  onClose: () => void;
  // In a real app, this comes from the current user's profile
  mockProfile?: {
    name: string;
    country: string;
    flag: string;
    city: string;
    timeInTulum: string;
    profession: string;
    bio: string;
    membership: string;
    avatarUrl: string;
    id: string;
  };
}

const DEFAULT_PROFILE = {
  id: "vap_camille_77x",
  name: "Camille Dubois",
  country: "France",
  flag: "🇫🇷",
  city: "Lyon",
  timeInTulum: "1.5 years",
  profession: "Holistic Therapist",
  bio: "Helping you reconnect with your energy and inner balance.",
  membership: "VIP Member",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=800",
};

export function VapIdCardModal({ isOpen, onClose, mockProfile = DEFAULT_PROFILE }: VapIdProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // Validation URL embedded in QR Code
  const validationUrl = `https://swipess.app/vap-validate/${mockProfile.id}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none"
          >
            {/* ID Card Wrapper (Pointer events restored here) */}
            <div className={cn(
              "relative w-full max-w-sm rounded-[32px] overflow-hidden pointer-events-auto shadow-2xl",
              isLight ? "bg-white border border-black/5" : "bg-zinc-900 border border-white/10"
            )}>
              
              {/* Top Premium Badge / Header */}
              <div className={cn(
                "w-full px-6 py-4 flex items-center justify-between",
                isLight ? "bg-zinc-50 border-b border-black/5" : "bg-black/40 border-b border-white/5"
              )}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("w-5 h-5", isLight ? "text-primary" : "text-white")} />
                  <span className={cn(
                    "text-xs font-bold tracking-widest uppercase",
                    isLight ? "text-primary" : "text-white"
                  )}>
                    Virtual Resident
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className={cn("w-5 h-5", isLight ? "text-black/40" : "text-white/40")} />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* User Info Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
                    <img 
                      src={mockProfile.avatarUrl} 
                      alt={mockProfile.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl" />
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <h2 className={cn(
                      "text-xl font-bold tracking-tight mb-1 flex items-center gap-2",
                      isLight ? "text-zinc-900" : "text-white"
                    )}>
                      {mockProfile.name} <span className="text-xl">{mockProfile.flag}</span>
                    </h2>
                    <p className={isLight ? "text-zinc-500" : "text-zinc-400"}>
                      {mockProfile.profession}
                    </p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium",
                      isLight ? "bg-primary/10 text-primary" : "bg-white/10 text-white"
                    )}>
                      <MapPin className="w-3.5 h-3.5" />
                      Tulum Local ({mockProfile.timeInTulum})
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className={cn(
                  "p-4 rounded-2xl mb-6",
                  isLight ? "bg-zinc-50" : "bg-white/5"
                )}>
                  <p className={cn(
                    "text-sm leading-relaxed italic",
                    isLight ? "text-zinc-600" : "text-zinc-300"
                  )}>
                    "{mockProfile.bio}"
                  </p>
                </div>

                {/* QR Code Validation Section */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 ring-4 ring-black/5 dark:ring-white/5 relative">
                    <QRCode 
                      value={validationUrl} 
                      size={140}
                      level="H" 
                      className="rounded-lg"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm">
                      <ScanLine className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className={cn(
                      "text-sm font-semibold tracking-wide uppercase",
                      isLight ? "text-zinc-800" : "text-white"
                    )}>
                      {mockProfile.membership}
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className={cn(
                    "text-xs mt-1 text-center",
                    isLight ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    Scan to verify Local Resident benefits
                  </p>
                </div>
              </div>

              {/* Decorative Liquid Mesh Glow */}
              <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                   style={{
                     background: isLight 
                      ? 'radial-gradient(circle at 100% 0%, rgba(var(--primary), 0.4) 0%, transparent 40%)'
                      : 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.4) 0%, transparent 40%)'
                   }} 
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
