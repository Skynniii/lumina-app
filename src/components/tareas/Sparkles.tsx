import { motion } from 'framer-motion';

export function Sparkles() {
  const particles = [...Array(12)].map((_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const dist = 18 + (i % 3) * 8;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + (i % 3) * 2, gold: i % 2 === 0 };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute w-[22px] h-[22px] border-2 border-[#7f70ff] rounded-full"
      />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 1.3, x: p.x, y: p.y }}
          transition={{ duration: 0.5, delay: (i % 3) * 0.04, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.gold ? '#ffcc00' : '#7f70ff' }}
        />
      ))}
      {[0, 90, 180, 270].map((rot, i) => (
        <motion.div
          key={`s${i}`}
          initial={{ opacity: 1, scale: 0, rotate: rot }}
          animate={{ opacity: 0, scale: 1.4, rotate: rot + 45 }}
          transition={{ duration: 0.5, delay: 0.05 * i, ease: 'easeOut' }}
          className="absolute text-[#ffcc00]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" /></svg>
        </motion.div>
      ))}
    </div>
  );
}
