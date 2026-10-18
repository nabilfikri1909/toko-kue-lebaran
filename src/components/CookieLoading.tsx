'use client';

import { motion } from 'framer-motion';

interface CookieLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CookieLoading({
  message = 'Menyiapkan toples kue Lebaran...',
  size = 'md',
}: CookieLoadingProps) {
  const cookieSize = size === 'sm' ? 'w-10 h-10 text-xl' : size === 'lg' ? 'w-20 h-20 text-4xl' : 'w-14 h-14 text-2xl';

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center select-none">
      <div className="relative">
        {/* Steam Animation */}
        <div className="absolute -top-4 inset-x-0 flex justify-center gap-1.5 opacity-70 pointer-events-none">
          {[0, 0.2, 0.4].map((delay, idx) => (
            <motion.span
              key={idx}
              initial={{ y: 0, opacity: 0, scale: 0.8 }}
              animate={{ y: -16, opacity: [0, 0.8, 0], scale: [0.8, 1.2, 1.4] }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                delay,
                ease: 'easeOut',
              }}
              className="text-honey text-xs font-bold"
            >
              ~
            </motion.span>
          ))}
        </div>

        {/* Animated Bouncing & Spinning Cookie */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 8, -8, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'easeInOut',
          }}
          className={`${cookieSize} rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-md flex items-center justify-center border-2 border-honey/40 relative`}
        >
          <span className="filter drop-shadow-sm">🍪</span>

          {/* Golden ring ripple */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border border-honey"
          />
        </motion.div>
      </div>

      {/* Loading message */}
      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="mt-4 font-playfair text-sm font-semibold text-cocoa"
      >
        {message}
      </motion.p>
      <div className="flex items-center gap-1 mt-1 text-honey">
        <span className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce" />
      </div>
    </div>
  );
}
