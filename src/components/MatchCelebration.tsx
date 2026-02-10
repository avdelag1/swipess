import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { triggerHaptic } from '@/utils/haptics';
import { playNotificationSound } from '@/utils/notificationSounds';

interface MatchCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage: () => void;
  matchedUser: {
    name: string;
    avatar?: string;
    role: 'client' | 'owner';
  };
}

export function MatchCelebration({ isOpen, onClose, onMessage, matchedUser }: MatchCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger celebration haptic when match celebration opens
      triggerHaptic('match');

      // Play celebratory bell sound for the match
      playNotificationSound('match').catch((error) => {
        console.warn('Failed to play match notification sound:', error);
      });

      const timer = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleStartConversation = () => {
    onMessage();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 50,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: -50,
                  rotate: 360,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3
                }}
              >
                {i % 3 === 0 ? (
                  <Flame className="w-6 h-6 text-orange-500 fill-current" />
                ) : i % 3 === 1 ? (
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Star className="w-4 h-4 text-red-400 fill-current" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 0.8 
            }}
            className="relative z-10 w-full max-w-md"
          >
            <Card className="p-8 text-center bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-2xl">
              {/* Match Text Animation */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-8"
              >
                <motion.h1
                  className="text-6xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-clip-text text-transparent"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  IT'S A MATCH!
                </motion.h1>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex justify-center mt-4"
                >
                  <div className="relative">
                    <Flame className="w-16 h-16 text-orange-500 fill-current" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0"
                    >
                      <Flame className="w-16 h-16 text-orange-300 fill-current" />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Profile Images */}
              <AnimatePresence>
                {showContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {/* Matched User Profile */}
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-orange-400 shadow-lg">
                          {matchedUser?.avatar ? (
                            <img 
                              src={matchedUser.avatar} 
                              alt={matchedUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                              {matchedUser?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold mt-2 text-gray-700">
                          {matchedUser?.name || 'User'}
                        </p>
                      </motion.div>

                      {/* Flame in the middle */}
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <Flame className="w-8 h-8 text-orange-500 fill-current" />
                      </motion.div>

                      {/* Current User Profile */}
                      <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-orange-400 shadow-lg">
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                            You
                          </div>
                        </div>
                        <p className="text-sm font-semibold mt-2 text-gray-700">
                          You
                        </p>
                      </motion.div>
                    </div>

                    <motion.p 
                      className="text-gray-600 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      You both liked each other! Start a conversation and make the magic happen.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                      className="flex gap-3 justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <Button
                        onClick={handleStartConversation}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 shadow-lg"
                      >
                        Start Conversation
                      </Button>
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Keep Browsing
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}