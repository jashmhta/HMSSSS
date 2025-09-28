import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ViewfinderCircleIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface DoctorPortalProps {
  doctorId?: string;
}

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
  license: string;
  department: string;
  email: string;
  phone: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  nextAppointment?: string;
  condition: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  chiefComplaint?: string;
  room?: string;
}

interface Task {
  id: string;
  type:
    | 'review_lab'
    | 'review_radiology'
    | 'prescription'
    | 'referral'
    | 'follow_up';
  patientName: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({ doctorId = '1' }) => {
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'patients' | 'schedule' | 'tasks' | 'messages'
  >('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API calls
    const fetchDoctorData = async () => {
      try {
        setTimeout(() => {
          const mockDoctor: DoctorInfo = {
            id: '1',
            name: 'Dr. Sarah Johnson',
            specialty: 'Cardiology',
            license: 'MD123456',
            department: 'Cardiology',
            email: 'sarah.johnson@hms.com',
            phone: '+1-555-0101',
          };

          const mockPatients: Patient[] = [
            {
              id: '1',
              name: 'John Doe',
              age: 45,
              gender: 'Male',
              lastVisit: '2025-09-15',
              nextAppointment: '2025-09-25',
              condition: 'Hypertension, Diabetes',
              priority: 'medium',
            },
            {
              id: '2',
              name: 'Jane Smith',
              age: 32,
              gender: 'Female',
              lastVisit: '2025-09-10',
              condition: 'Asthma',
              priority: 'low',
            },
            {
              id: '3',
              name: 'Robert Johnson',
              age: 28,
              gender: 'Male',
              lastVisit: '2025-09-20',
              condition: 'Sports Injury - Knee',
              priority: 'high',
            },
          ];

          const mockAppointments: Appointment[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              time: '10:00 AM',
              type: 'follow-up',
              status: 'scheduled',
              chiefComplaint: 'Blood pressure check',
              room: 'Room 101',
            },
            {
              id: '2',
              patientId: '4',
              patientName: 'Alice Brown',
              time: '11:30 AM',
              type: 'consultation',
              status: 'scheduled',
              chiefComplaint: 'Chest pain evaluation',
              room: 'Room 101',
            },
            {
              id: '3',
              patientId: '2',
              patientName: 'Jane Smith',
              time: '2:00 PM',
              type: 'follow-up',
              status: 'scheduled',
              chiefComplaint: 'Asthma review',
              room: 'Room 102',
            },
          ];

          const mockTasks: Task[] = [
            {
              id: '1',
              type: 'review_lab',
              patientName: 'John Doe',
              description: 'Review lipid panel results',
              priority: 'high',
              dueDate: '2025-09-22',
              status: 'pending',
            },
            {
              id: '2',
              type: 'review_radiology',
              patientName: 'Alice Brown',
              description: 'Review chest X-ray for pneumonia',
              priority: 'urgent',
              dueDate: '2025-09-21',
              status: 'pending',
            },
            {
              id: '3',
              type: 'prescription',
              patientName: 'Jane Smith',
              description: 'Renew albuterol inhaler prescription',
              priority: 'medium',
              dueDate: '2025-09-25',
              status: 'pending',
            },
            {
              id: '4',
              type: 'follow_up',
              patientName: 'Robert Johnson',
              description: 'Schedule follow-up for knee injury',
              priority: 'medium',
              dueDate: '2025-09-30',
              status: 'in-progress',
            },
          ];

          setDoctor(mockDoctor);
          setPatients(mockPatients);
          setAppointments(mockAppointments);
          setTasks(mockTasks);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch doctor data:', error);
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  const todayAppointments = appointments.filter(
    (apt) => apt.status !== 'cancelled',
  );
  const pendingTasks = tasks.filter((task) => task.status !== 'completed');
  const urgentTasks = tasks.filter(
    (task) => task.priority === 'urgent' || task.priority === 'high',
  );
  const criticalPatients = patients.filter(
    (patient) => patient.priority === 'critical',
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'review_lab':
        return BeakerIcon;
      case 'review_radiology':
        return ViewfinderCircleIcon;
      case 'prescription':
        return HeartIcon;
      case 'referral':
        return UserGroupIcon;
      case 'follow_up':
        return CalendarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading doctor portal...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Doctor not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please contact support if you believe this is an error.
          </p>
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
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-medium text-lg">Dr</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Dr. {doctor.name.split(' ')[1]}
                </h1>
                <p className="text-gray-600">
                  {doctor.specialty} • {doctor.department}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-lg font-semibold text-gray-900">
                  {todayAppointments.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-lg font-semibold text-gray-900">
                  {pendingTasks.length}
                </p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {urgentTasks.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400" />
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
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-3 inline" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'patients'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mr-3 inline" />
                My Patients
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'schedule'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="h-5 w-5 mr-3 inline" />
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckCircleIcon className="h-5 w-5 mr-3 inline" />
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'messages'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3 inline" />
                Messages
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/doctor-portal/patient/new"
                  className="block w-full text-left px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Patient
                </Link>
                <Link
                  href="/doctor-portal/appointment/new"
                  className="block w-full text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  New Appointment
                </Link>
                <Link
                  href="/doctor-portal/prescription/new"
                  className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Write Prescription
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Critical Alerts */}
                {(criticalPatients.length > 0 || urgentTasks.length > 0) && (
                  <div className="space-y-4">
                    {criticalPatients.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                              Critical Patients
                            </p>
                            <p className="text-sm text-red-700">
                              {criticalPatients.length} patient
                              {criticalPatients.length !== 1 ? 's' : ''}{' '}
                              requiring immediate attention.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {urgentTasks.length > 0 && (
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                        <div className="flex">
                          <ClockIcon className="h-5 w-5 text-orange-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-orange-800">
                              Urgent Tasks
                            </p>
                            <p className="text-sm text-orange-700">
                              {urgentTasks.length} urgent task
                              {urgentTasks.length !== 1 ? 's' : ''} require
                              immediate action.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Today's Schedule */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Today's Schedule
                  </h3>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {todayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <ClockIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {appointment.patientName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {appointment.time} • {appointment.type}
                              </div>
                              {appointment.chiefComplaint && (
                                <div className="text-sm text-gray-500">
                                  {appointment.chiefComplaint}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                appointment.status === 'scheduled'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : appointment.status === 'in-progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {appointment.status}
                            </span>
                            {appointment.room && (
                              <span className="text-sm text-gray-500">
                                {appointment.room}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No appointments scheduled for today
                    </p>
                  )}
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Pending Tasks
                  </h3>
                  {pendingTasks.length > 0 ? (
                    <div className="space-y-3">
                      {pendingTasks.slice(0, 5).map((task) => {
                        const Icon = getTaskTypeIcon(task.type);
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {task.patientName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {task.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Due:{' '}
                                  {format(
                                    new Date(task.dueDate),
                                    'MMM d, yyyy',
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                  task.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No pending tasks
                    </p>
                  )}
                </div>

                {/* Patient Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Patient Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {patients.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Patients
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {patients.filter((p) => p.nextAppointment).length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Scheduled Follow-ups
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {
                          patients.filter(
                            (p) =>
                              p.priority === 'high' ||
                              p.priority === 'critical',
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-500">High Priority</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Patients
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <Link
                      href="/doctor-portal/patient/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      Add Patient
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {patient.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {patient.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {patient.age} years • {patient.gender}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(patient.priority)}`}
                        >
                          {patient.priority}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Condition:</span>
                          <span className="ml-1 font-medium">
                            {patient.condition}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Last Visit:</span>
                          <span className="ml-1">
                            {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {patient.nextAppointment && (
                          <div className="text-sm">
                            <span className="text-gray-500">
                              Next Appointment:
                            </span>
                            <span className="ml-1 text-blue-600">
                              {format(
                                new Date(patient.nextAppointment),
                                'MMM d, yyyy',
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/doctor-portal/patient/${patient.id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Chart
                        </Link>
                        <Link
                          href={`/doctor-portal/appointment/new?patient=${patient.id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Schedule
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Today's Schedule
                  </h2>
                  <Link
                    href="/doctor-portal/appointment/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    New Appointment
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </h3>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {[
                      '9:00 AM',
                      '10:00 AM',
                      '11:00 AM',
                      '12:00 PM',
                      '1:00 PM',
                      '2:00 PM',
                      '3:00 PM',
                      '4:00 PM',
                      '5:00 PM',
                    ].map((time) => {
                      const appointment = todayAppointments.find(
                        (apt) => apt.time === time,
                      );
                      return (
                        <div key={time} className="p-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm font-medium text-gray-900 w-20">
                                {time}
                              </div>
                              {appointment ? (
                                <div className="flex items-center space-x-4">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {appointment.patientName}
                                    </div>
                                    <div className="text-sm text-gray-600 capitalize">
                                      {appointment.type}
                                    </div>
                                    {appointment.chiefComplaint && (
                                      <div className="text-sm text-gray-500">
                                        {appointment.chiefComplaint}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">
                                  Available
                                </div>
                              )}
                            </div>
                            {appointment && (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                    appointment.status === 'scheduled'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : appointment.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {appointment.status}
                                </span>
                                {appointment.room && (
                                  <span className="text-sm text-gray-500">
                                    {appointment.room}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Clinical Tasks
                </h2>

                <div className="space-y-4">
                  {tasks.map((task) => {
                    const Icon = getTaskTypeIcon(task.type);
                    return (
                      <div
                        key={task.id}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <Icon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {task.patientName}
                                </h3>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority}
                                </span>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                    task.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : task.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">
                                {task.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                Due:{' '}
                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {task.status !== 'completed' && (
                              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                  <Link
                    href="/doctor-portal/message/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    New Message
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No messages yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Messages from patients and colleagues will appear here.
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

export default DoctorPortal;
