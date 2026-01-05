'use client';

import { motion } from 'framer-motion';

interface SupportCompanionAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export default function SupportCompanionAvatar({ 
  size = 'md', 
  state = 'idle',
  className = '' 
}: SupportCompanionAvatarProps) {
  const dimension = sizeMap[size];
  const innerSize = dimension * 0.6;
  
  const pulseVariants = {
    idle: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    listening: {
      scale: [1, 1.1, 1],
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    thinking: {
      scale: [1, 1.08, 1.02, 1.08, 1],
      opacity: 1,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    speaking: {
      scale: [1, 1.12, 1.05, 1.1, 1],
      opacity: 1,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const glowVariants = {
    idle: {
      opacity: [0.3, 0.5, 0.3],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    listening: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    thinking: {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.15, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear" as const
      }
    },
    speaking: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.25, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const eyeVariants = {
    open: { scaleY: 1 },
    blink: { 
      scaleY: [1, 0.1, 1],
      transition: {
        duration: 0.15,
        times: [0, 0.5, 1]
      }
    }
  };

  // Pet-friendly teal/blue color scheme
  const primaryColor = '#14B8A6'; // Teal-500
  const secondaryColor = '#0891B2'; // Cyan-600
  const accentColor = '#F97316'; // Orange-500 (for warmth)

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* Outer glow ring - calming teal */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${primaryColor}40 0%, ${primaryColor}00 70%)`,
        }}
        variants={glowVariants}
        animate={state}
      />
      
      {/* Secondary glow - warm accent */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dimension * 0.85,
          height: dimension * 0.85,
          background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}00 60%)`,
        }}
        animate={{
          rotate: [0, 360],
          transition: {
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }
        }}
      />

      {/* Main avatar circle */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: innerSize,
          height: innerSize,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`,
          boxShadow: `0 4px 20px ${primaryColor}40, inset 0 2px 10px rgba(255, 255, 255, 0.2)`,
        }}
        variants={pulseVariants}
        animate={state}
      >
        {/* Paw print icon in center */}
        <div className="relative flex items-center justify-center" style={{ width: innerSize * 0.7, height: innerSize * 0.7 }}>
          {/* Main pad */}
          <div 
            className="absolute bg-white rounded-full"
            style={{
              width: innerSize * 0.25,
              height: innerSize * 0.2,
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '40% 40% 50% 50%',
            }}
          />
          {/* Toe pads */}
          {[
            { left: '20%', bottom: '45%' },
            { left: '35%', bottom: '55%' },
            { left: '50%', bottom: '55%' },
            { left: '65%', bottom: '45%' },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: innerSize * 0.12,
                height: innerSize * 0.12,
                ...pos,
                transform: 'translateX(-50%)',
              }}
              initial="open"
              animate="blink"
              variants={eyeVariants}
              transition={{
                repeat: Infinity,
                repeatDelay: 3 + Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Floating hearts for speaking state */}
      {state === 'speaking' && (
        <>
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-400"
              style={{
                fontSize: dimension * 0.15,
              }}
              animate={{
                y: [-5, -15, -5],
                x: [(i - 0.5) * 15, (i - 0.5) * 20, (i - 0.5) * 15],
                opacity: [0, 1, 0],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              ♥
            </motion.div>
          ))}
        </>
      )}

      {/* Floating particles for thinking state */}
      {state === 'thinking' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4,
                height: 4,
                backgroundColor: accentColor,
              }}
              animate={{
                y: [-10, -20, -10],
                x: [0, (i - 1) * 10, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
