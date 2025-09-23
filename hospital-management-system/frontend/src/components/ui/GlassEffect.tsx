'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  hover?: boolean;
  glow?: boolean;
}

const glassVariants = {
  light: 'bg-white/10',
  medium: 'bg-white/20',
  heavy: 'bg-white/30',
};

const blurVariants = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export function GlassEffect({
  children,
  className = '',
  intensity = 'medium',
  blur = 'lg',
  border = true,
  hover = false,
  glow = false,
}: GlassEffectProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl transition-all duration-300',
        glassVariants[intensity],
        blurVariants[blur],
        border && 'border border-white/20',
        glow && 'shadow-lg shadow-white/10',
        hover && 'hover:bg-white/30 hover:border-white/30 hover:shadow-xl hover:shadow-white/20',
        className
      )}
      whileHover={hover ? { scale: 1.02 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
    >
      {children}

      {/* Subtle animated gradient overlay */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-50"
        animate={{
          background: [
            'linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)',
            'linear-gradient(225deg, transparent, rgba(255,255,255,0.08), transparent)',
            'linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)',
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
}

interface NeumorphicProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'flat' | 'concave' | 'convex';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  press?: boolean;
}

export function Neumorphic({
  children,
  className = '',
  variant = 'flat',
  size = 'md',
  hover = false,
  press = true,
}: NeumorphicProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseClasses = 'relative transition-all duration-300 rounded-2xl';

  const variantClasses = {
    flat: 'bg-gray-100 dark:bg-gray-800',
    concave: 'bg-gray-100 dark:bg-gray-800 shadow-inner shadow-gray-300/50 dark:shadow-gray-700/50',
    convex: 'bg-gray-100 dark:bg-gray-800 shadow-lg shadow-gray-300/50 dark:shadow-gray-700/50',
  };

  return (
    <motion.div
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        hover && 'hover:shadow-xl hover:shadow-gray-400/50 dark:hover:shadow-gray-600/50',
        className
      )}
      whileHover={hover ? { y: -2 } : {}}
      whileTap={press ? { scale: 0.98 } : {}}
    >
      {children}

      {/* Animated highlight effect */}
      {hover && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FloatingCard({
  children,
  className = '',
  delay = 0,
  duration = 6,
}: FloatingCardProps) {
  return (
    <motion.div
      className={cn('relative', className)}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 1, 0, -1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

interface GlowingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function GlowingButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  glow = true,
}: GlowingButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative font-medium rounded-lg transition-all duration-300 transform',
        variantClasses[variant],
        sizeClasses[size],
        glow && 'shadow-lg hover:shadow-xl',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated glow effect */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Pulsing glow */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-50"
          style={{
            boxShadow: `0 0 20px ${variant === 'primary' ? 'rgba(59, 130, 246, 0.5)' :
                              variant === 'secondary' ? 'rgba(147, 51, 234, 0.5)' :
                              variant === 'success' ? 'rgba(34, 197, 94, 0.5)' :
                              variant === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
                              'rgba(239, 68, 68, 0.5)'}`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}