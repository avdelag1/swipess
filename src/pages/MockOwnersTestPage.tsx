import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, DollarSign, Star, Heart, MessageCircle, 
  ChevronLeft, ChevronRight, Verified, Clock,
  Bike, Wrench, Briefcase
} from 'lucide-react';
import { mockOwnerProfiles, MockListing } from '@/data/mockOwnerProfiles';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from 'sonner';

const PLACEHOLDER_BASE = 'https://images.unsplash.com';

function ListingBadge({ type }: { type: MockListing['type'] }) {
  const config = {
    motorcycle: { icon: Bike, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Motocicleta' },
    bicycle: { icon: Bike, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Bicicleta' },
    worker: { icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Servicio' },
    job: { icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Empleo' },
  };
  
  const { icon: Icon, color, bg, label } = config[type];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function MockOwnersTestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listingIndex, setListingIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [likedOwners, setLikedOwners] = useState<Set<string>>(new Set());
  
  const owner = mockOwnerProfiles[currentIndex];
  const listing = owner.listings[listingIndex];
  const totalOwners = mockOwnerProfiles.length;
  const totalListings = owner.listings.length;

  const handlePrevOwner = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev - 1 + totalOwners) % totalOwners);
    setListingIndex(0);
    setImageIndex(0);
  };

  const handleNextOwner = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev + 1) % totalOwners);
    setListingIndex(0);
    setImageIndex(0);
  };

  const handlePrevListing = () => {
    triggerHaptic('light');
    setListingIndex((prev) => (prev - 1 + totalListings) % totalListings);
    setImageIndex(0);
  };

  const handleNextListing = () => {
    triggerHaptic('light');
    setListingIndex((prev) => (prev + 1) % totalListings);
    setImageIndex(0);
  };

  const handleLike = () => {
    triggerHaptic('success');
    setLikedOwners((prev) => new Set([...prev, owner.user_id]));
    toast.success(`Le diste like a ${owner.name}!`);
  };

  const handlePass = () => {
    triggerHaptic('warning');
    toast.info(`Pasaste a ${owner.name}`);
  };

  const handleMessage = () => {
    triggerHaptic('medium');
    toast.success(`Abriendo chat con ${owner.name}...`);
  };

  const handleImagePrev = () => {
    const images = owner.profile_images;
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageNext = () => {
    const images = owner.profile_images;
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Propietarios de Prueba
          </h1>
          <span className="text-sm text-white/60">
            {currentIndex + 1} / {totalOwners}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-24">
        {/* Owner Profile Image */}
        <div className="relative h-[45vh] overflow-hidden">
          <motion.img
            key={`${owner.user_id}-${imageIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={owner.profile_images[imageIndex] || `${PLACEHOLDER_BASE}/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop`}
            alt={owner.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          
          {/* Image navigation */}
          <div className="absolute inset-0 flex" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX < rect.width * 0.4) handleImagePrev();
            else if (clickX > rect.width * 0.6) handleImageNext();
          }}>
            <div className="flex-1 cursor-pointer" />
            <div className="flex-1 cursor-pointer" />
          </div>

          {/* Image dots */}
          <div className="absolute top-20 left-4 right-4 flex gap-1 z-10">
            {owner.profile_images.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1 rounded-full transition-all ${
                  idx === imageIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Owner info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{owner.name}</h2>
              <span className="text-xl text-white/80">{owner.age}</span>
              {owner.verified && (
                <Verified className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="flex items-center gap-1 text-white/90 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{owner.city}, {owner.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{owner.rating}</span>
                <span className="text-white/70 text-sm">({owner.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 text-white/60 text-sm">
                <Clock className="w-3 h-3" />
                <span>{owner.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-white/80 text-sm">{owner.bio}</p>
        </div>

        {/* Listings Navigation */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Listings ({listingIndex + 1}/{totalListings})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevListing}
                className="p-1 rounded-full hover:bg-white/10"
                disabled={totalListings <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextListing}
                className="p-1 rounded-full hover:bg-white/10"
                disabled={totalListings <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {owner.listings.map((lst, idx) => (
              <button
                key={lst.id}
                onClick={() => setListingIndex(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  idx === listingIndex 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {lst.type}
              </button>
            ))}
          </div>
        </div>

        {/* Current Listing Card */}
        {listing && (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-4 p-4 bg-gray-900 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <ListingBadge type={listing.type} />
            </div>
            
            <h3 className="text-lg font-bold mb-2">{listing.title}</h3>
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{listing.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold text-xl">
                  {listing.price.toLocaleString('es-MX')}
                  <span className="text-sm text-green-400/70 ml-1">
                    {listing.priceType === 'month' ? '/mes' : 
                     listing.priceType === 'hour' ? '/hora' : ''}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/60">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{listing.location.split(',')[0]}</span>
              </div>
            </div>

            {/* Listing specs */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {Object.entries(listing.specifications).slice(0, 4).map(([key, value]) => (
                  <span key={key} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60">
                    {key}: {value}
                  </span>
                ))}\
              </div>
            </div>
          </motion.div>
        )}

        {/* Tags */}
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {listing?.tags.map((tag) => (
              <span key={tag} className="text-xs bg-white/5 px-2 py-1 rounded text-white/50">
                #{tag}
              </span>
            ))}\
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 p-4">
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
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${
              likedOwners.has(owner.user_id)
                ? 'bg-green-500/20 border-green-500'
                : 'bg-green-500/20 border-green-500 hover:bg-green-500/30'
            }`}
          >
            <Heart 
              className={`w-8 h-8 ${likedOwners.has(owner.user_id) ? 'text-green-500 fill-green-500' : 'text-green-500'}`} 
            />
          </button>
        </div>

        {/* Owner navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          <button
            onClick={handlePrevOwner}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-white/40 text-xs">
            {likedOwners.size} likes dados
          </span>
          <button
            onClick={handleNextOwner}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
