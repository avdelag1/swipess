import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, DollarSign, Briefcase, Star, 
  MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  CircleDot, Bike, Wrench, Briefcase as JobIcon
} from 'lucide-react';
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

  if (!currentOwner) return null;

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
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Image navigation dots */}
        <div className="absolute top-16 left-4 right-4 flex gap-1 z-10">
          {currentOwner.profile_images.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx === imageIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Image tap navigation */}
        <div className="absolute inset-0 flex z-0" onClick={(e) => {
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
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
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

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePass}
            className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all active:scale-95"
          >
            <ChevronLeft className="w-8 h-8 text-red-500" />
          </button>
          
          <button
            onClick={handleMessage}
            className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center hover:bg-blue-500/30 transition-all active:scale-95"
          >
            <MessageCircle className="w-6 h-6 text-blue-500" />
          </button>
          
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center hover:bg-green-500/30 transition-all active:scale-95"
          >
            <Heart className="w-8 h-8 text-green-500" fill="none" />
          </button>
        </div>

        {/* Owner navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Anterior</span>
          </button>
          <span className="text-white/40 text-sm">{currentIndex + 1} / {mockOwnerProfiles.length}</span>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-white/60 hover:text-white"
          >
            <span className="text-sm">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

export default memo(MockOwnerSwipeView);
