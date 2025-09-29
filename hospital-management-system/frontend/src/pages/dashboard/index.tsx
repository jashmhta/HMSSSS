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
  ArrowUpIcon,
  ArrowDownIcon,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Hospital Dashboard</CardTitle>
              <CardDescription className="text-lg">
                Welcome back! Here's what's happening today.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => (window.location.href = card.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold">
                      {card.value}
                    </p>
                    <div className="flex items-center space-x-1">
                      {isPositive ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                        {card.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">from last week</span>
                    </div>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                  onClick={() => (window.location.href = action.href)}
                >
                  <div className={`${action.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center">
                    {action.name}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Patients by Department</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Module Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Module Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {moduleStats.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => (window.location.href = module.href)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {module.name}
                        </p>
                        {module.count !== null && (
                          <p className="text-2xl font-bold">
                            {module.count.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
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
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">{appointment.type}</p>
                  </div>
                  <Badge variant="secondary">{appointment.time}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  type: 'warning',
                  title: 'Low Stock Alert',
                  message: 'Paracetamol tablets running low',
                  variant: 'default' as const,
                },
                {
                  type: 'info',
                  title: 'Pending Lab Results',
                  message: '12 test results awaiting review',
                  variant: 'secondary' as const,
                },
                {
                  type: 'error',
                  title: 'Equipment Maintenance',
                  message: 'MRI machine maintenance due',
                  variant: 'destructive' as const,
                },
                {
                  type: 'success',
                  title: 'Backup Completed',
                  message: 'Daily backup completed successfully',
                  variant: 'default' as const,
                },
              ].map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Badge variant={alert.variant}>{alert.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
