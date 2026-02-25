import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, DollarSign, Briefcase, Star,
  MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  CircleDot, Bike, Wrench, Briefcase as JobIcon, RefreshCw
} from 'lucide-react';
import { RadarSearchEffect } from '@/components/ui/RadarSearchEffect';
import { triggerHaptic } from '@/utils/haptics';
import { mockOwnerProfiles, MockListing } from '@/data/mockOwnerProfiles';

// Using placeholder images
const PLACEHOLDER_BASE = 'https://images.unsplash.com';

interface MockOwnerSwipeViewProps {
  onLike?: (ownerId: string, listingId: string) => void;
  onPass?: (ownerId: string) => void;
  onMessage?: (ownerId: string) => void;
}

export function MockOwnerSwipeView({ onLike, onPass, onMessage }: MockOwnerSwipeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const currentOwner = mockOwnerProfiles[currentIndex];
  const currentListing = currentOwner?.listings[0]; // Show first listing type

  const handleNext = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev + 1) % mockOwnerProfiles.length);
    setImageIndex(0);
  };

  const handlePrev = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev - 1 + mockOwnerProfiles.length) % mockOwnerProfiles.length);
    setImageIndex(0);
  };

  const handleLike = () => {
    triggerHaptic('success');
    onLike?.(currentOwner.user_id, currentListing?.id || '');
    setTimeout(handleNext, 300);
  };

  const handlePass = () => {
    triggerHaptic('warning');
    onPass?.(currentOwner.user_id);
    setTimeout(handleNext, 300);
  };

  const handleMessage = () => {
    triggerHaptic('medium');
    onMessage?.(currentOwner.user_id);
  };

  if (!currentOwner) {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center space-y-6 p-8"
        >
          <RadarSearchEffect
            size={120}
            color="#E4007C" // Mexican Pink for Owner matches
            isActive={true}
            icon={<Heart className="w-6 h-6 text-white opacity-80" fill="currentColor" />}
          />

          <div className="space-y-2 mt-8">
            <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
            <p className="text-white/60 text-sm max-w-xs mx-auto">
              No new client activity for your listings at the moment. Check back later!
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              // Could refresh via prop in future, for mock just reset index
              setCurrentIndex(0);
            }}
            className="mt-6 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Image Carousel */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentOwner.user_id}-${imageIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <img
              src={currentOwner.profile_images[imageIndex] || `${PLACEHOLDER_BASE}/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop`}
              alt={currentOwner.name}
              className="w-full h-full object-cover"
            />
            {/* Top edge gradient - Matches TopBar.tsx for visual continuity */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

            {/* Bottom edge gradient - Matches BottomNavigation.tsx & Card Info requirements */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Image navigation dots */}
        <div className="absolute top-16 left-4 right-4 flex gap-1 z-20 pointer-events-none">
          {currentOwner.profile_images.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${idx === imageIndex ? 'bg-white shadow-sm' : 'bg-white/40'
                }`}
            />
          ))}
        </div>

        {/* Image tap navigation */}
        <div className="absolute inset-0 flex z-30" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < rect.width * 0.4) {
            setImageIndex((prev) => (prev - 1 + currentOwner.profile_images.length) % currentOwner.profile_images.length);
          } else if (clickX > rect.width * 0.6) {
            setImageIndex((prev) => (prev + 1) % currentOwner.profile_images.length);
          }
        }}>
          <div className="flex-1" />
          <div className="flex-1" />
        </div>

        {/* Owner info overlay */}
        <div className="absolute bottom-32 left-0 right-0 p-4 z-40 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">{currentOwner.name}</h2>
            <span className="text-xl text-white/80">{currentOwner.age}</span>
            {currentOwner.verified && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Verified</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/90 mb-2">
            <MapPin className="w-4 h-4" />
            <span>{currentOwner.city}, {currentOwner.country}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold">{currentOwner.rating}</span>
              <span className="text-white/70 text-sm">({currentOwner.reviewCount})</span>
            </div>
            <span className="text-white/60 text-sm">Responde en {currentOwner.responseTime}</span>
          </div>

          {/* Bio */}
          <p className="text-white/90 text-sm mb-4 line-clamp-2">{currentOwner.bio}</p>
        </div>
      </div>

      {/* Listing card */}
      <div className="bg-gray-900 p-4">
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          {/* Listing type badge */}
          <div className="flex items-center gap-2 mb-3">
            {currentListing?.type === 'motorcycle' && <CircleDot className="w-5 h-5 text-orange-400" />}
            {currentListing?.type === 'bicycle' && <Bike className="w-5 h-5 text-green-400" />}
            {currentListing?.type === 'worker' && <Wrench className="w-5 h-5 text-blue-400" />}
            {currentListing?.type === 'job' && <JobIcon className="w-5 h-5 text-purple-400" />}
            <span className="text-white/60 text-sm uppercase">{currentListing?.type}</span>
          </div>

          <h3 className="text-white font-bold text-lg mb-2">{currentListing?.title}</h3>
          <p className="text-white/70 text-sm mb-3 line-clamp-2">{currentListing?.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold text-xl">
                {currentListing?.price.toLocaleString('es-MX')}
                <span className="text-sm text-green-400/70 ml-1">
                  {currentListing?.priceType === 'month' ? '/mes' :
                    currentListing?.priceType === 'hour' ? '/hora' :
                      currentListing?.priceType === 'sale' ? '' : ''}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/60">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{currentListing?.location.split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 mt-4 relative z-50">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePass();
            }}
            className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 hover:bg-black/60 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMessage();
            }}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-blue-400 hover:bg-black/60 transition-colors"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLike();
            }}
            className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-green-400 hover:bg-black/60 transition-colors"
          >
            <Heart className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Carousel indicator for mock data */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="flex flex-col items-center gap-1 text-white/60 hover:text-white pointer-events-auto bg-black/20 p-2 rounded-xl backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs">Prev Profile</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="flex flex-col items-center gap-1 text-white/60 hover:text-white pointer-events-auto bg-black/20 p-2 rounded-xl backdrop-blur-sm"
        >
          <span className="text-xs">Next Profile</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';

export default memo(MockOwnerSwipeView);
