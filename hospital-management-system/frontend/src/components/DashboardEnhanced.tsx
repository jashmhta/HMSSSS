'use client';

import React, { useState, useEffect } from 'react';

/* eslint-disable import/no-relative-parent-imports */

import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  FileText,
  Pill,
  TestTube,
  Activity,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Bell,
  User,
   Heart,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';

import { GlassEffect, Neumorphic, FloatingCard, GlowingButton } from './ui/GlassEffect';
import { ThemeToggle, useTheme } from './ui/ThemeProvider';

// Constants for magic numbers
const LOADING_TIMEOUT = 1500;
const ANIMATION_DELAY = 2;
const PARTICLE_COUNT = 20;
const CHART_HEIGHT = 300;
const PIE_CHART_HEIGHT = 200;
const ICON_SIZE = 24;
const PARTICLE_Y_OFFSET = -100;
const ANIMATION_DURATION_BASE = 3;
const ANIMATION_DURATION_VARIANCE = 2;
const BORDER_RADIUS_CHART = 4;
const OUTER_RADIUS = 80;
const WELCOME_DELAY = 0.2;
const PATIENT_CHART_DELAY = 0.4;
const REVENUE_CHART_DELAY = 0.6;
const DEPARTMENT_CHART_DELAY = 0.8;
const ACTIVITIES_DELAY = 1;
const PROGRESS_BAR_MAX = 100;
const MOTION_Y_OFFSET = -10;
const MOTION_DURATION = 2;
const PARTICLE_SCALE_FACTOR = 1.2;
const NOTIFICATION_SCALE = 1.2;

interface IStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down';
}

const StatCardTrend: React.FC<{ trend: 'up' | 'down'; change: number }> = ({ trend, change }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn(
      'flex items-center text-sm font-medium',
      trend === 'up' ? 'text-green-400' : 'text-red-400',
    )}
  >
    {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
    <span className="ml-1">{Math.abs(change)}%</span>
  </motion.div>
);

const StatCardProgress: React.FC<{ color: string; change: number | undefined }> = ({ color, change }) => (
  <motion.div
    className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
    initial={{ width: 0 }}
    animate={{ width: '100%' }}
    transition={{ duration: 1, delay: 0.5 }}
  >
    <motion.div
      className={cn('h-full rounded-full', color.replace('bg-', 'bg-').replace('text-', 'bg-'))}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(Math.abs(change ?? 0), PROGRESS_BAR_MAX)}%` }}
      transition={{ duration: 1, delay: 0.8 }}
    />
  </motion.div>
);

function StatCard({ title, value, change, icon, color, trend }: IStatCardProps) {
  return (
    <FloatingCard delay={Math.random() * 2}>
      <GlassEffect
        intensity="medium"
        blur="lg"
        border
        hover
        glow
        className="p-6 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-lg', color)}>
            {icon}
          </div>
          {trend && change !== undefined && (
            <StatCardTrend trend={trend} change={change} />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </motion.div>

        <StatCardProgress color={color} change={change ?? undefined} />
      </GlassEffect>
    </FloatingCard>
  );
}

interface IActivityItemProps {
  type: 'appointment' | 'emergency' | 'lab' | 'radiology' | 'admission';
  title: string;
  description: string;
  time: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

function ActivityItem({ type, title, description, time, priority }: IActivityItemProps) {
  const icons = {
    appointment: Calendar,
    emergency: AlertTriangle,
    lab: TestTube,
    radiology: Eye,
    admission: Users,
  };

  const colors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    >
      <div className={cn('p-2 rounded-lg', colors[priority])}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {description}
        </p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </motion.div>
  );
}

const ParticleBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: PARTICLE_COUNT }, (_unused: unknown, i: number) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, PARTICLE_Y_OFFSET, 0],
          opacity: [0, 1, 0],
          scale: [1, PARTICLE_SCALE_FACTOR, 1],
        }}
        transition={{
          duration: ANIMATION_DURATION_BASE + Math.random() * ANIMATION_DURATION_VARIANCE,
          repeat: Infinity,
          delay: Math.random() * ANIMATION_DELAY,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </div>
);

const ChartsSection: React.FC<{
  isDark: boolean;
  patientData: any[];
  revenueData: any[];
}> = ({ isDark, patientData, revenueData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    {/* Patient Flow Chart */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: WELCOME_DELAY }}
    >
      <GlassEffect intensity="medium" blur="lg" border>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Patient Flow (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={patientData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#3b82f6"
                fill="url(#colorPatients)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="admitted"
                stroke="#10b981"
                fill="url(#colorAdmitted)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorAdmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassEffect>
    </motion.div>

    {/* Revenue Chart */}
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: PATIENT_CHART_DELAY }}
    >
      <GlassEffect intensity="medium" blur="lg" border>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Overview
          </h3>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[BORDER_RADIUS_CHART, BORDER_RADIUS_CHART, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" radius={[BORDER_RADIUS_CHART, BORDER_RADIUS_CHART, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassEffect>
    </motion.div>
  </div>
);

const BottomSection: React.FC<{
  isDark: boolean;
  departmentData: any[];
  recentActivities: IActivityItemProps[];
}> = ({ isDark, departmentData, recentActivities }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Department Distribution */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: REVENUE_CHART_DELAY }}
    >
      <GlassEffect intensity="medium" blur="lg" border>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Department Distribution
          </h3>
          <ResponsiveContainer width="100%" height={PIE_CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                outerRadius={OUTER_RADIUS}
                dataKey="value"
                label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`}
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassEffect>
    </motion.div>

    {/* Recent Activities */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: DEPARTMENT_CHART_DELAY }}
      className="lg:col-span-2"
    >
      <GlassEffect intensity="medium" blur="lg" border>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activities
            </h3>
            <GlowingButton variant="primary" size="sm">
              View All
            </GlowingButton>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </GlassEffect>
    </motion.div>
  </div>
);

const QuickActions: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: ACTIVITIES_DELAY }}
    className="mt-8"
  >
    <GlassEffect intensity="medium" blur="lg" border>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlowingButton variant="primary" className="flex items-center justify-center space-x-2">
            <Plus size={16} />
            <span>New Patient</span>
          </GlowingButton>
          <GlowingButton variant="secondary" className="flex items-center justify-center space-x-2">
            <Calendar size={16} />
            <span>Schedule</span>
          </GlowingButton>
          <GlowingButton variant="success" className="flex items-center justify-center space-x-2">
            <FileText size={16} />
            <span>Records</span>
          </GlowingButton>
          <GlowingButton variant="warning" className="flex items-center justify-center space-x-2">
            <Pill size={16} />
            <span>Pharmacy</span>
          </GlowingButton>
        </div>
      </div>
    </GlassEffect>
  </motion.div>
);

const DashboardContent: React.FC = () => {
  const { isDark } = useTheme();
  const {
    isLoading,
    patientData,
    revenueData,
    departmentData,
    recentActivities,
  } = useDashboardData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WelcomeSection />
      <StatsGrid />
      <ChartsSection isDark={isDark} patientData={patientData} revenueData={revenueData} />
      <BottomSection isDark={isDark} departmentData={departmentData} recentActivities={recentActivities} />
      <QuickActions />
    </main>
  );
};

const DashboardHeader: React.FC = () => (
  <header className="border-b border-white/10 backdrop-blur-md bg-white/5 dark:bg-black/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ rotate: 10 }}
            className="p-2 rounded-lg bg-blue-500"
          >
            <Heart className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Hospital Management System
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }}>
            <GlassEffect intensity="light" blur="md" border hover>
              <div className="p-2">
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </GlassEffect>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <GlassEffect intensity="light" blur="md" border hover>
              <div className="p-2 relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <motion.div
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  animate={{ scale: [1, NOTIFICATION_SCALE, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </GlassEffect>
          </motion.div>

          <ThemeToggle />

          <motion.div whileHover={{ scale: 1.05 }}>
            <GlassEffect intensity="light" blur="md" border hover>
              <div className="p-2">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </GlassEffect>
          </motion.div>
        </div>
      </div>
    </div>
  </header>
);

const QuickStats: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    <Neumorphic variant="concave">
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">24</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Active Cases</p>
      </div>
    </Neumorphic>
    <Neumorphic variant="concave">
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">8</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Surgeries Today</p>
      </div>
    </Neumorphic>
    <Neumorphic variant="concave">
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-600">3</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
      </div>
    </Neumorphic>
    <Neumorphic variant="concave">
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-600">15</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Available Beds</p>
      </div>
    </Neumorphic>
  </div>
);

const WelcomeSection: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <GlassEffect intensity="heavy" blur="xl" border glow>
      <div className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, Dr. Anderson
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your patients today
            </p>
          </div>
          <motion.div
            animate={{ y: [0, MOTION_Y_OFFSET, 0] }}
            transition={{ duration: MOTION_DURATION, repeat: Infinity }}
            className="text-5xl"
          >
            👨‍⚕️
          </motion.div>
        </div>
        <QuickStats />
      </div>
    </GlassEffect>
  </motion.div>
);

const StatsGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard
      title="Total Patients"
      value="1,247"
      change={12}
       icon={<Users size={ICON_SIZE} className="text-blue-500" />}
      color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
      trend="up"
    />
    <StatCard
      title="Active Patients"
      value="1,180"
      change={8}
       icon={<Activity size={ICON_SIZE} className="text-green-500" />}
      color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
      trend="up"
    />
    <StatCard
      title="Today's Appointments"
      value="45"
      change={-3}
       icon={<Calendar size={ICON_SIZE} className="text-purple-500" />}
      color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
      trend="down"
    />
    <StatCard
      title="Pending Bills"
      value="23"
      change={5}
       icon={<DollarSign size={ICON_SIZE} className="text-orange-500" />}
      color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
      trend="up"
    />
  </div>
);

const getPatientData = () => [
  { name: 'Mon', patients: 45, admitted: 12 },
  { name: 'Tue', patients: 52, admitted: 15 },
  { name: 'Wed', patients: 48, admitted: 10 },
  { name: 'Thu', patients: 61, admitted: 18 },
  { name: 'Fri', patients: 55, admitted: 14 },
  { name: 'Sat', patients: 38, admitted: 8 },
  { name: 'Sun', patients: 42, admitted: 11 },
];

const getRevenueData = () => [
  { name: 'Jan', revenue: 45000, profit: 28000 },
  { name: 'Feb', revenue: 52000, profit: 32000 },
  { name: 'Mar', revenue: 48000, profit: 29000 },
  { name: 'Apr', revenue: 61000, profit: 38000 },
  { name: 'May', revenue: 55000, profit: 34000 },
  { name: 'Jun', revenue: 67000, profit: 42000 },
];

const getDepartmentData = () => [
  { name: 'Emergency', value: 35, color: '#ef4444' },
  { name: 'ICU', value: 25, color: '#f97316' },
  { name: 'Surgery', value: 20, color: '#eab308' },
  { name: 'General', value: 20, color: '#22c55e' },
];

const getRecentActivities = (): IActivityItemProps[] => [
  {
    type: 'emergency',
    title: 'Emergency Admittance',
    description: 'John Doe - Cardiac arrest',
    time: '2 min ago',
    priority: 'critical',
  },
  {
    type: 'appointment',
    title: 'Scheduled Appointment',
    description: 'Dr. Smith - General checkup',
    time: '15 min ago',
    priority: 'medium',
  },
  {
    type: 'lab',
    title: 'Lab Results Ready',
    description: 'Jane Smith - Blood test results',
    time: '1 hour ago',
    priority: 'low',
  },
  {
    type: 'radiology',
    title: 'X-Ray Completed',
    description: 'Mike Johnson - Chest X-Ray',
    time: '2 hours ago',
    priority: 'medium',
  },
  {
    type: 'admission',
    title: 'Patient Admitted',
    description: 'Sarah Williams - Surgery prep',
    time: '3 hours ago',
    priority: 'high',
  },
];

const useDashboardData = () => {
  const [isLoading, setIsLoading] = useState(true);

  const patientData = getPatientData();
  const revenueData = getRevenueData();
  const departmentData = getDepartmentData();
  const recentActivities = getRecentActivities();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), LOADING_TIMEOUT);
    return () => clearTimeout(timer);
  }, []);

  return {
    isLoading,
    patientData,
    revenueData,
    departmentData,
    recentActivities,
  };
};

export default function DashboardEnhanced() {
  const { isDark } = useTheme();

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      isDark ? 'dark bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
    )}>
      <ParticleBackground />

      <div className="relative z-10">
        <DashboardHeader />
        <DashboardContent />
      </div>
    </div>
  );
}