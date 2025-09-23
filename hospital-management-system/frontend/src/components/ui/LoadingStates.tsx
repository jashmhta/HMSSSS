'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'shimmer';
  lines?: number;
  width?: string | number;
  height?: string | number;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  color?: string;
  className?: string;
}

interface LoadingCardProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'skeleton' | 'spinner' | 'shimmer';
  title?: string;
  subtitle?: string;
  avatar?: boolean;
  lines?: number;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  variant?: 'overlay' | 'inline' | 'skeleton';
  className?: string;
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1,
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  };

  const animationVariants = {
    pulse: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      x: [-100, 100],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    shimmer: {
      background: [
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
              className
            )}
            style={i === 0 ? style : {}}
            animate={animationVariants[animation]}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      animate={animationVariants[animation]}
    />
  );
}

export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'text-blue-600',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 ${color} rounded-full`}
                animate={{
                  y: ['0%', '-50%', '0%'],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );
      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-1 ${color} rounded-full`}
                animate={{
                  scaleY: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} ${color} rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 0.3, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      default: // spinner
        return (
          <motion.div
            className={cn(sizeClasses[size], 'border-2 border-gray-200 border-t-current rounded-full', color)}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
    }
  };

  return <div className={cn('flex items-center justify-center', className)}>{renderSpinner()}</div>;
}

export function LoadingCard({
  className = '',
  variant = 'skeleton',
  title,
  subtitle,
  avatar = false,
  lines = 3,
}: LoadingCardProps) {
  return (
    <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm', className)}>
      {avatar && <Skeleton variant="circular" width={40} height={40} className="mb-3" />}
      {title && <Skeleton variant="text" width="60%" height={20} className="mb-2" />}
      {subtitle && <Skeleton variant="text" width="40%" height={16} className="mb-3" />}

      {variant === 'skeleton' && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === lines - 1 ? '80%' : '100%'}
              height={16}
            />
          ))}
        </div>
      )}

      {variant === 'spinner' && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {variant === 'shimmer' && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              animation="shimmer"
              width={i === lines - 1 ? '80%' : '100%'}
              height={16}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LoadingOverlay({
  isLoading,
  children,
  message = 'Loading...',
  variant = 'overlay',
  className = '',
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 flex items-center justify-center backdrop-blur-sm z-50',
              variant === 'overlay' && 'bg-white/70 dark:bg-gray-900/70',
              variant === 'inline' && 'bg-transparent'
            )}
          >
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <motion.p
                className="text-gray-600 dark:text-gray-400 text-sm font-medium"
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {message}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProgressBar({
  progress,
  className = '',
  variant = 'linear',
  size = 'md',
  color = 'bg-blue-600',
  showLabel = true,
  animated = true,
}: ProgressBarProps) {
  const sizeClasses = {
    linear: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
    circular: {
      sm: 'w-12 h-12',
      md: 'w-16 h-16',
      lg: 'w-20 h-20',
    },
  };

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn('relative flex items-center justify-center', sizeClasses.circular[size], className)}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className={color}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
        </svg>
        {showLabel && (
          <span className="absolute text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeClasses.linear[size])}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {animated && (
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Smart loading components for specific use cases
export function PatientCardSkeleton() {
  return (
    <LoadingCard
      avatar={true}
      title="Patient Name"
      subtitle="Patient ID"
      lines={4}
      className="border border-gray-200 dark:border-gray-700"
    />
  );
}

export function AppointmentSkeleton() {
  return (
    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={12} height={12} />
        <div className="flex-1">
          <Skeleton variant="text" width="70%" height={16} />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="100%" height={14} />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width={20} height={14} />
          </div>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width="60%" height={16} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  width={colIndex === 0 ? '80%' : '60%'}
                  height={16}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}