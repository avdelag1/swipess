import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Home, Car, Bike, Briefcase, User, Upload, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectListing?: (category: string) => void;
  onSelectProfile?: () => void;
}

/**
 * Listing categories users can choose from
 */
const listingCategories = [
  { id: 'property', label: 'Property', icon: Home, description: 'Houses, apartments, rooms' },
  { id: 'motorcycle', label: 'Motorcycle', icon: Car, description: 'Bikes, scooters, mopeds' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, description: 'Bikes, e-bikes, fixies' },
  { id: 'services', label: 'Job / Work', icon: Briefcase, description: 'Skills, services, jobs' },
];

type Step = 'choice' | 'listing-category' | null;

export function GetStartedModal({ isOpen, onClose, onSelectListing, onSelectProfile }: GetStartedModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('choice');

  const handleChoiceSelect = useCallback((choice: 'listing' | 'profile') => {
    if (choice === 'listing') {
      setStep('listing-category');
    } else {
      onSelectProfile?.();
      onClose();
      navigate('/client/profile');
    }
  }, [onSelectProfile, onClose, navigate]);

  const handleListingCategorySelect = useCallback((category: string) => {
    onSelectListing?.(category);
    onClose();
    navigate(`/owner/properties/new?category=${category}`);
  }, [onSelectListing, onClose, navigate]);

  const handleClose = useCallback(() => {
    setStep('choice');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
          >
            <div className="bg-gray-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  {step === 'choice' ? 'What do you want to do?' : 'Choose a category'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {step === 'choice' ? (
                    <motion.div
                      key="choice"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      {/* Upload Listing Option */}
                      <button
                        onClick={() => handleChoiceSelect('listing')}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl',
                          'bg-gradient-to-r from-orange-500/20 to-amber-500/10',
                          'border border-orange-500/30',
                          'hover:border-orange-500/50 hover:brightness-110',
                          'transition-all duration-150',
                          'active:scale-[0.98]',
                          'text-left group'
                        )}
                      >
                        <div className="p-3 rounded-xl bg-orange-500 text-white">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">Upload a Listing</h3>
                          <p className="text-sm text-white/60">
                            Offer something people can discover
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      {/* Create Profile Option */}
                      <button
                        onClick={() => handleChoiceSelect('profile')}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl',
                          'bg-gradient-to-r from-cyan-500/20 to-blue-500/10',
                          'border border-cyan-500/30',
                          'hover:border-cyan-500/50 hover:brightness-110',
                          'transition-all duration-150',
                          'active:scale-[0.98]',
                          'text-left group'
                        )}
                      >
                        <div className="p-3 rounded-xl bg-cyan-500 text-white">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">Create Your Profile</h3>
                          <p className="text-sm text-white/60">
                            Be found by owners or recruiters
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  ) : step === 'listing-category' ? (
                    <motion.div
                      key="listing-category"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-2"
                    >
                      {listingCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleListingCategorySelect(category.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl',
                            'bg-white/5 border border-white/10',
                            'hover:bg-white/10 hover:border-white/20',
                            'transition-all duration-150',
                            'active:scale-[0.98]',
                            'text-left group'
                          )}
                        >
                          <div className="p-2 rounded-lg bg-white/10">
                            <category.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{category.label}</h4>
                            <p className="text-xs text-white/50">{category.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {step === 'listing-category' && (
                <div className="px-4 py-3 border-t border-white/10">
                  <button
                    onClick={() => setStep('choice')}
                    className="w-full py-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    ← Back to choices
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GetStartedModal;
