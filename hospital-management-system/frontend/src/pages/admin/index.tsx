import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  XRayIcon,
  CurrencyDollarIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  UserIcon,
  BuildingOfficeIcon,
  KeyIcon,
  BellIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AdminDashboardProps {
  adminId?: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  systemUptime: number;
  serverLoad: number;
  databaseConnections: number;
}

interface RecentActivity {
  id: string;
  type:
    | "user_login"
    | "appointment_booked"
    | "payment_processed"
    | "system_alert"
    | "user_created";
  description: string;
  timestamp: string;
  user?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: string;
  resolved: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminId = "1" }) => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    systemUptime: 0,
    serverLoad: 0,
    databaseConnections: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "system" | "security" | "reports"
  >("overview");

  useEffect(() => {
    // Simulate API calls
    const fetchAdminData = async () => {
      try {
        setTimeout(() => {
          const mockStats: SystemStats = {
            totalUsers: 245,
            activeUsers: 189,
            totalPatients: 1250,
            totalAppointments: 342,
            totalRevenue: 245000,
            systemUptime: 99.8,
            serverLoad: 45,
            databaseConnections: 23,
          };

          const mockActivity: RecentActivity[] = [
            {
              id: "1",
              type: "user_login",
              description: "Dr. Sarah Johnson logged in",
              timestamp: "2025-09-21T10:30:00Z",
              user: "Dr. Sarah Johnson",
            },
            {
              id: "2",
              type: "appointment_booked",
              description: "New appointment booked for John Doe",
              timestamp: "2025-09-21T10:15:00Z",
              user: "Reception Staff",
            },
            {
              id: "3",
              type: "payment_processed",
              description: "Payment of $150.00 processed",
              timestamp: "2025-09-21T09:45:00Z",
              user: "Billing System",
            },
            {
              id: "4",
              type: "user_created",
              description: "New nurse account created",
              timestamp: "2025-09-21T09:30:00Z",
              user: "Admin",
            },
          ];

          const mockAlerts: SystemAlert[] = [
            {
              id: "1",
              title: "High Server Load",
              message: "Server CPU usage is above 80%",
              severity: "warning",
              timestamp: "2025-09-21T08:00:00Z",
              resolved: false,
            },
            {
              id: "2",
              title: "Backup Completed",
              message: "Daily system backup completed successfully",
              severity: "info",
              timestamp: "2025-09-21T02:00:00Z",
              resolved: true,
            },
            {
              id: "3",
              title: "Security Alert",
              message: "Multiple failed login attempts detected",
              severity: "error",
              timestamp: "2025-09-20T23:15:00Z",
              resolved: true,
            },
          ];

          setStats(mockStats);
          setRecentActivity(mockActivity);
          setSystemAlerts(mockAlerts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [adminId]);

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case "user_login":
        return UserIcon;
      case "appointment_booked":
        return CalendarIcon;
      case "payment_processed":
        return CurrencyDollarIcon;
      case "system_alert":
        return ExclamationTriangleIcon;
      case "user_created":
        return UserGroupIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const criticalAlerts = systemAlerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "error",
  );
  const unresolvedAlerts = systemAlerts.filter((alert) => !alert.resolved);

  // Mock data for charts
  const userActivityData = [
    { name: "Mon", logins: 45, appointments: 12 },
    { name: "Tue", logins: 52, appointments: 19 },
    { name: "Wed", logins: 48, appointments: 15 },
    { name: "Thu", logins: 61, appointments: 22 },
    { name: "Fri", logins: 55, appointments: 18 },
    { name: "Sat", logins: 23, appointments: 8 },
    { name: "Sun", logins: 18, appointments: 5 },
  ];

  const departmentData = [
    { name: "Cardiology", patients: 120, color: "#3B82F6" },
    { name: "Emergency", patients: 95, color: "#EF4444" },
    { name: "Orthopedics", patients: 78, color: "#10B981" },
    { name: "General Medicine", patients: 110, color: "#F59E0B" },
    { name: "Pediatrics", patients: 65, color: "#8B5CF6" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  System Administration & Monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">System Status</p>
                <p className="text-lg font-semibold text-green-600">Healthy</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.activeUsers}
                </p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <BellIcon className="h-6 w-6" />
                {unresolvedAlerts.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-3 inline" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "users"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-3 inline" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "system"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ServerIcon className="h-5 w-5 mr-3 inline" />
                System Health
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "security"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <KeyIcon className="h-5 w-5 mr-3 inline" />
                Security
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "reports"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 inline" />
                Reports
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/admin/user/new"
                  className="block w-full text-left px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </Link>
                <Link
                  href="/admin/system/backup"
                  className="block w-full text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  System Backup
                </Link>
                <Link
                  href="/admin/security/audit"
                  className="block w-full text-left px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Security Audit
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Critical Alerts */}
                {(criticalAlerts.length > 0 || unresolvedAlerts.length > 0) && (
                  <div className="space-y-4">
                    {criticalAlerts.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                              Critical Alerts
                            </p>
                            <p className="text-sm text-red-700">
                              {criticalAlerts.length} critical system alert
                              {criticalAlerts.length !== 1 ? "s" : ""} require
                              immediate attention.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {unresolvedAlerts.length > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <BellIcon className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800">
                              System Alerts
                            </p>
                            <p className="text-sm text-yellow-700">
                              {unresolvedAlerts.length} unresolved system alert
                              {unresolvedAlerts.length !== 1 ? "s" : ""}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* System Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalUsers}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <UserIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Active Users
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.activeUsers}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Patients
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalPatients.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Monthly Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          System Uptime
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.systemUptime}%
                        </p>
                      </div>
                      <ServerIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Server Load
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.serverLoad}%
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          DB Connections
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.databaseConnections}
                        </p>
                      </div>
                      <ServerIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      User Activity (7 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="logins"
                          fill="#3B82F6"
                          name="User Logins"
                        />
                        <Bar
                          dataKey="appointments"
                          fill="#10B981"
                          name="Appointments"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Department Distribution
                    </h3>
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

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Activity
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {recentActivity.map((activity) => {
                      const Icon = getActivityTypeIcon(activity.type);
                      return (
                        <div key={activity.id} className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 p-2 rounded-lg">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {activity.user && `${activity.user} • `}
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    User Management
                  </h2>
                  <Link
                    href="/admin/user/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Add User
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      User management interface
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create, edit, and manage user accounts and permissions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  System Health & Monitoring
                </h2>

                {/* System Alerts */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      System Alerts
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {systemAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-6 ${!alert.resolved ? "bg-opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`p-2 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                            >
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {alert.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!alert.resolved && (
                              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                                Resolve
                              </button>
                            )}
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                alert.resolved
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {alert.resolved ? "Resolved" : "Active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Security Management
                  </h2>
                  <Link
                    href="/admin/security/audit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Run Security Audit
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Security controls and audit logs
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Monitor security events, manage permissions, and review
                      audit trails.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Reports & Analytics
                  </h2>
                  <Link
                    href="/admin/reports/generate"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Generate Report
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      System reports and analytics
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Generate comprehensive reports on system usage,
                      performance, and operations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
