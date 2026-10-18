'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationStore, FlyingCookie } from '@/lib/animationStore';

export default function FlyingCookieOverlay() {
  const flyingCookies = useAnimationStore((s) => s.flyingCookies);
  const removeFlyingCookie = useAnimationStore((s) => s.removeFlyingCookie);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {flyingCookies.map((cookie) => (
          <SingleFlyingCookie
            key={cookie.id}
            cookie={cookie}
            onComplete={() => removeFlyingCookie(cookie.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SingleFlyingCookie({
  cookie,
  onComplete,
}: {
  cookie: FlyingCookie;
  onComplete: () => void;
}) {
  const { startX, startY, endX, endY, icon = '🍪' } = cookie;

  // Arc apex: higher than both start and end
  const apexY = Math.min(startY, endY) - 100;

  return (
    <motion.div
      initial={{
        x: startX - 16,
        y: startY - 16,
        scale: 0.8,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        x: [startX - 16, (startX + endX) / 2, endX - 16],
        y: [startY - 16, apexY, endY - 16],
        scale: [0.8, 1.4, 0.4],
        rotate: [0, 240, 720],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.65,
        ease: [0.25, 0.1, 0.25, 1],
        times: [0, 0.45, 1],
      }}
      onAnimationComplete={onComplete}
      className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center filter drop-shadow-md select-none text-2xl z-50"
    >
      <span>{icon}</span>

      {/* Trailing golden sparkles */}
      <motion.span
        initial={{ opacity: 0.8, scale: 0.8 }}
        animate={{ opacity: 0, scale: 0.2 }}
        transition={{ duration: 0.3, repeat: 2 }}
        className="absolute -bottom-1 -left-1 text-xs text-honey"
      >
        ✨
      </motion.span>
    </motion.div>
  );
}
