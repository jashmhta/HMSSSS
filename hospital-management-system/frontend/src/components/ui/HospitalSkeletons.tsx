'use client';

import React from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { Skeleton, LoadingCard } from './LoadingStates';

// Patient Management Skeletons
export function PatientListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="20%" height={16} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton variant="text" width="90%" height={14} />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton variant="rounded" width={60} height={20} />
                <Skeleton variant="rounded" width={80} height={20} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PatientDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-6">
          <Skeleton variant="circular" width={96} height={96} />
          <div className="flex-1 space-y-3">
            <Skeleton variant="text" width="50%" height={28} />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="90%" height={16} />
              <Skeleton variant="text" width="70%" height={16} />
            </div>
            <div className="flex space-x-3">
              <Skeleton variant="rounded" width={100} height={32} />
              <Skeleton variant="rounded" width={120} height={32} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <LoadingCard
              lines={2}
              className="border border-gray-200 dark:border-gray-700"
            />
          </motion.div>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tab Headers */}
        <div className="flex space-x-1 p-1 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={100}
              height={36}
              className="flex-1"
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="70%" height={16} />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height={14} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Appointment Skeletons
export function AppointmentCalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="30%" height={24} />
          <div className="flex space-x-2">
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={80} height={32} />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="text" width="100%" height={16} />
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width="100%"
              height={60}
              className={cn(
                i % 7 === 0 || i % 7 === 6 ? 'bg-gray-50 dark:bg-gray-900' : '',
              )}
            />
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton variant="text" width="40%" height={20} />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="rounded" width={60} height={20} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton variant="text" width="80%" height={14} />
                    <Skeleton variant="text" width="70%" height={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Medical Records Skeletons
export function MedicalRecordSkeleton() {
  return (
    <div className="space-y-6">
      {/* Record Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton variant="text" width="50%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </div>
          <div className="flex space-x-2">
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={80} height={32} />
          </div>
        </div>

        {/* Record Meta */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton variant="text" width="60%" height={14} className="mx-auto mb-1" />
              <Skeleton variant="text" width="80%" height={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Record Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton variant="text" width="40%" height={20} />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton variant="text" width="30%" height={14} />
                    <Skeleton variant="text" width="100%" height={16} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Skeleton variant="text" width="60%" height={20} className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="70%" height={14} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <Skeleton variant="text" width="50%" height={20} className="mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="rounded" width={40} height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeletons
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <LoadingCard
              lines={2}
              className="border border-gray-200 dark:border-gray-700"
            />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="rounded" width={80} height={28} />
          </div>
          <div className="h-64">
            <Skeleton variant="rectangular" width="100%" height="100%" className="rounded" />
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="rounded" width={80} height={28} />
          </div>
          <div className="h-64">
            <Skeleton variant="rectangular" width="100%" height="100%" className="rounded" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Skeleton variant="text" width="30%" height={20} />
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
                 <Skeleton variant="text" width="20%" height={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Laboratory/Radiology Skeletons
export function LabResultSkeleton() {
  return (
    <div className="space-y-6">
      {/* Test Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} />
          </div>
          <div className="flex space-x-2">
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={80} height={32} />
          </div>
        </div>

        {/* Test Status */}
        <div className="flex items-center space-x-4">
          <Skeleton variant="rounded" width={120} height={24} />
          <Skeleton variant="text" width="30%" height={16} />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton variant="text" width="40%" height={20} />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <Skeleton variant="text" width="80%" height={14} />
                <Skeleton variant="text" width="60%" height={14} />
                <Skeleton variant="text" width="50%" height={14} />
                <Skeleton variant="rounded" width={80} height={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Billing/Insurance Skeletons
export function BillingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <LoadingCard
              lines={2}
              className="border border-gray-200 dark:border-gray-700"
            />
          </motion.div>
        ))}
      </div>

      {/* Invoice List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="rounded" width={100} height={32} />
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <Skeleton variant="text" width="40%" height={16} />
                  <Skeleton variant="text" width="30%" height={14} />
                </div>
                <Skeleton variant="rounded" width={80} height={24} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton variant="text" width="60%" height={12} className="mb-1" />
                    <Skeleton variant="text" width="80%" height={14} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Smart Loading Component
export interface ISmartSkeletonProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
  className?: string;
}

export function SmartSkeleton({
  isLoading,
  children,
  skeleton,
  delay = 200,
  fallback,
  className = '',
}: ISmartSkeletonProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  if (!isLoading && !showSkeleton) {
    return <>{children}</>;
  }

  if (showSkeleton) {
    return (
      <div className={className}>
        {skeleton || fallback || <Skeleton variant="rectangular" width="100%" height={200} />}
      </div>
    );
  }

  return <>{children}</>;
}