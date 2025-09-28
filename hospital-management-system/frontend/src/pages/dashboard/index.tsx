import React, { useState, useEffect } from 'react';

import {
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ViewfinderCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
   TruckIcon,
   UserIcon,
  ClipboardDocumentListIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
   ResponsiveContainer,
   PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  pendingBills: number;
  lowStockMedications: number;
  pendingLabTests: number;
  pendingRadiologyTests: number;
  emergencyAlerts: number;
  totalStaff: number;
  occupiedBeds: number;
  availableBeds: number;
  monthlyRevenue: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    todayAppointments: 0,
    pendingBills: 0,
    lowStockMedications: 0,
    pendingLabTests: 0,
    pendingRadiologyTests: 0,
    emergencyAlerts: 0,
    totalStaff: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    monthlyRevenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      try {
        setTimeout(() => {
          setStats({
            totalPatients: 1250,
            activePatients: 1180,
            todayAppointments: 45,
            pendingBills: 23,
            lowStockMedications: 8,
            pendingLabTests: 12,
            pendingRadiologyTests: 6,
            emergencyAlerts: 2,
            totalStaff: 156,
            occupiedBeds: 89,
            availableBeds: 111,
            monthlyRevenue: 245000,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      href: '/patient',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.toString(),
      icon: CalendarIcon,
      color: 'bg-green-500',
      change: '+8%',
      href: '/appointments',
    },
    {
      title: 'Active Patients',
      value: stats.activePatients.toLocaleString(),
      icon: UsersIcon,
      color: 'bg-purple-500',
      change: '+5%',
      href: '/patient',
    },
    {
      title: 'Pending Bills',
      value: stats.pendingBills.toString(),
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      change: '-3%',
      href: '/billing',
    },
    {
      title: 'Low Stock Medications',
      value: stats.lowStockMedications.toString(),
      icon: HeartIcon,
      color: 'bg-red-500',
      change: '+2',
      href: '/pharmacy',
    },
    {
      title: 'Pending Lab Tests',
      value: stats.pendingLabTests.toString(),
      icon: BeakerIcon,
      color: 'bg-indigo-500',
      change: '+4',
      href: '/lab',
    },
    {
      title: 'Pending Radiology',
      value: stats.pendingRadiologyTests.toString(),
      icon: ViewfinderCircleIcon,
      color: 'bg-pink-500',
      change: '+1',
      href: '/radiology',
    },
    {
      title: 'Emergency Alerts',
      value: stats.emergencyAlerts.toString(),
      icon: ExclamationTriangleIcon,
      color: 'bg-orange-500',
      change: '0',
      href: '/emergency',
    },
  ];

  const quickActions = [
    {
      name: 'New Patient',
      icon: UsersIcon,
      href: '/patient/new',
      color: 'bg-blue-500',
    },
    {
      name: 'Schedule Appointment',
      icon: CalendarIcon,
      href: '/appointments/new',
      color: 'bg-green-500',
    },
    {
      name: 'Medical Records',
      icon: DocumentTextIcon,
      href: '/records',
      color: 'bg-purple-500',
    },
    {
      name: 'Emergency',
      icon: ExclamationTriangleIcon,
      href: '/emergency',
      color: 'bg-red-500',
    },
    {
      name: 'Laboratory',
      icon: BeakerIcon,
      href: '/lab',
      color: 'bg-indigo-500',
    },
    {
      name: 'Radiology',
      icon: ViewfinderCircleIcon,
      href: '/radiology',
      color: 'bg-pink-500',
    },
    {
      name: 'Pharmacy',
      icon: HeartIcon,
      href: '/pharmacy',
      color: 'bg-yellow-500',
    },
    {
      name: 'Billing',
      icon: CurrencyDollarIcon,
      href: '/billing',
      color: 'bg-orange-500',
    },
  ];

  const moduleStats = [
    {
      name: 'Staff Management',
      count: stats.totalStaff,
      icon: UserIcon,
      href: '/hr',
    },
    {
      name: 'Inventory Items',
      count: 2450,
      icon: TruckIcon,
      href: '/inventory',
    },
    {
      name: 'Reports Generated',
      count: 89,
      icon: ClipboardDocumentListIcon,
      href: '/reports',
    },
    { name: 'System Settings', count: null, icon: CogIcon, href: '/settings' },
  ];

  // Mock data for charts
  const appointmentData = [
    { name: 'Mon', appointments: 12 },
    { name: 'Tue', appointments: 19 },
    { name: 'Wed', appointments: 15 },
    { name: 'Thu', appointments: 22 },
    { name: 'Fri', appointments: 18 },
    { name: 'Sat', appointments: 8 },
    { name: 'Sun', appointments: 5 },
  ];

  const departmentData = [
    { name: 'Cardiology', patients: 120, color: '#3B82F6' },
    { name: 'Orthopedics', patients: 95, color: '#10B981' },
    { name: 'Neurology', patients: 78, color: '#F59E0B' },
    { name: 'Pediatrics', patients: 110, color: '#EF4444' },
    { name: 'Dermatology', patients: 65, color: '#8B5CF6' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hospital Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => (window.location.href = card.href)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {card.change} from last week
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => (window.location.href = action.href)}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div
                  className={`${action.color} p-3 rounded-lg mb-2 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">
                  {action.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Weekly Appointments
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="appointments" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Patients by Department
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="patients"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Module Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {moduleStats.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => (window.location.href = module.href)}
              >
                <div className="bg-gray-100 p-3 rounded-lg mr-4">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {module.name}
                  </p>
                  {module.count !== null && (
                    <p className="text-2xl font-bold text-gray-900">
                      {module.count.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Today's Appointments
          </h2>
          <div className="space-y-3">
            {[
              {
                patient: 'John Doe',
                time: '10:00 AM',
                type: 'Cardiology Consultation',
              },
              {
                patient: 'Jane Smith',
                time: '11:30 AM',
                type: 'General Checkup',
              },
              {
                patient: 'Bob Johnson',
                time: '2:00 PM',
                type: 'Dental Cleaning',
              },
              {
                patient: 'Alice Brown',
                time: '3:30 PM',
                type: 'Orthopedic Review',
              },
            ].map((appointment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{appointment.patient}</p>
                  <p className="text-sm text-gray-600">{appointment.type}</p>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {appointment.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Alerts
          </h2>
          <div className="space-y-3">
            {[
              {
                type: 'warning',
                title: 'Low Stock Alert',
                message: 'Paracetamol tablets running low',
                color: 'yellow',
              },
              {
                type: 'info',
                title: 'Pending Lab Results',
                message: '12 test results awaiting review',
                color: 'blue',
              },
              {
                type: 'error',
                title: 'Equipment Maintenance',
                message: 'MRI machine maintenance due',
                color: 'red',
              },
              {
                type: 'success',
                title: 'Backup Completed',
                message: 'Daily backup completed successfully',
                color: 'green',
              },
            ].map((alert, index) => (
              <div
                key={index}
                className={`flex items-start p-3 bg-${alert.color}-50 border-l-4 border-${alert.color}-400 rounded`}
              >
                <div className="ml-3">
                  <p className={`font-medium text-${alert.color}-800`}>
                    {alert.title}
                  </p>
                  <p className={`text-sm text-${alert.color}-600`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
