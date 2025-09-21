import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  FileText,
  Pill,
  TestTube,
  XRay,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  pendingBills: number;
  lowStockMedications: number;
  pendingLabTests: number;
  pendingRadiologyTests: number;
  emergencyAlerts: number;
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
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      try {
        // In real app, this would be an API call
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
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.toString(),
      icon: Calendar,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "Active Patients",
      value: stats.activePatients.toLocaleString(),
      icon: Users,
      color: "bg-purple-500",
      change: "+5%",
    },
    {
      title: "Pending Bills",
      value: stats.pendingBills.toString(),
      icon: DollarSign,
      color: "bg-yellow-500",
      change: "-3%",
    },
    {
      title: "Low Stock Medications",
      value: stats.lowStockMedications.toString(),
      icon: Pill,
      color: "bg-red-500",
      change: "+2",
    },
    {
      title: "Pending Lab Tests",
      value: stats.pendingLabTests.toString(),
      icon: TestTube,
      color: "bg-indigo-500",
      change: "+4",
    },
    {
      title: "Pending Radiology",
      value: stats.pendingRadiologyTests.toString(),
      icon: XRay,
      color: "bg-pink-500",
      change: "+1",
    },
    {
      title: "Emergency Alerts",
      value: stats.emergencyAlerts.toString(),
      icon: AlertTriangle,
      color: "bg-orange-500",
      change: "0",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hospital Management System
              </h1>
              <p className="text-gray-600">Welcome back, Admin</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                New Appointment
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Add Patient
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border"
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
                      {card.change} from last month
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Patient Registration</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Schedule Appointment</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Medical Records</span>
            </button>
            <button className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium">Billing</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Appointments
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-gray-600">
                    Cardiology Consultation
                  </p>
                </div>
                <span className="text-sm text-blue-600">10:00 AM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-gray-600">General Checkup</p>
                </div>
                <span className="text-sm text-blue-600">11:30 AM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Bob Johnson</p>
                  <p className="text-sm text-gray-600">Dental Cleaning</p>
                </div>
                <span className="text-sm text-blue-600">2:00 PM</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              System Alerts
            </h2>
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Low Stock Alert</p>
                  <p className="text-sm text-red-600">
                    Paracetamol tablets running low
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Pending Lab Results
                  </p>
                  <p className="text-sm text-yellow-600">
                    12 test results awaiting review
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <AlertTriangle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Maintenance Due</p>
                  <p className="text-sm text-blue-600">
                    MRI machine maintenance scheduled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
