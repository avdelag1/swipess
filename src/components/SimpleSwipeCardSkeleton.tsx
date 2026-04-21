import React from 'react';
import { motion } from 'framer-motion';

export const SimpleSwipeCardSkeleton = () => {
  return (
    <div className="absolute inset-0 flex flex-col p-0">
      <div className="flex-1 relative rounded-[32px] overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse">
        {/* Shimmer effect */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />
        
        {/* Info Skeleton */}
        <div className="absolute bottom-[140px] left-6 right-6 z-20">
          <div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4" />
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="h-5 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

