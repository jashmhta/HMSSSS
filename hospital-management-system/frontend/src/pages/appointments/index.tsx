import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
   MagnifyingGlassIcon,
   PencilIcon,
  EyeIcon,
   CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addDays,
} from 'date-fns';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  room?: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchAppointments = async () => {
      try {
        setTimeout(() => {
          const mockAppointments: Appointment[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              doctorId: '1',
              doctorName: 'Dr. Sarah Johnson',
              specialty: 'Cardiology',
              date: '2025-09-21',
              time: '10:00',
              duration: 30,
              type: 'consultation',
              status: 'confirmed',
              notes: 'Follow-up for hypertension',
              room: 'Room 101',
            },
            {
              id: '2',
              patientId: '2',
              patientName: 'Jane Smith',
              doctorId: '2',
              doctorName: 'Dr. Michael Chen',
              specialty: 'General Medicine',
              date: '2025-09-21',
              time: '11:30',
              duration: 45,
              type: 'follow-up',
              status: 'scheduled',
              notes: 'Annual checkup',
              room: 'Room 102',
            },
            {
              id: '3',
              patientId: '3',
              patientName: 'Robert Johnson',
              doctorId: '3',
              doctorName: 'Dr. Emily Davis',
              specialty: 'Orthopedics',
              date: '2025-09-22',
              time: '14:00',
              duration: 60,
              type: 'procedure',
              status: 'confirmed',
              notes: 'Knee surgery consultation',
              room: 'Room 201',
            },
            {
              id: '4',
              patientId: '4',
              patientName: 'Alice Brown',
              doctorId: '1',
              doctorName: 'Dr. Sarah Johnson',
              specialty: 'Cardiology',
              date: '2025-09-23',
              time: '09:00',
              duration: 30,
              type: 'consultation',
              status: 'completed',
              notes: 'ECG results review',
              room: 'Room 101',
            },
          ];
          setAppointments(mockAppointments);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-500';
      case 'follow-up':
        return 'bg-green-500';
      case 'procedure':
        return 'bg-purple-500';
      case 'emergency':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || appointment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter((apt) =>
      isSameDay(new Date(apt.date), date),
    );
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading appointments...</p>
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
              Appointment Scheduling
            </h1>
            <p className="text-gray-600 mt-1">
              Manage patient appointments and schedules
            </p>
          </div>
          <Link
            href="/appointments/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Appointment
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by patient or doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="day">Day View</option>
              <option value="week">Week View</option>
              <option value="month">Month View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            ← Previous Week
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            Next Week →
          </button>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`min-h-32 border rounded-lg p-3 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
              >
                <div className="text-center mb-2">
                  <div
                    className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-lg ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded ${getTypeColor(appointment.type)} text-white cursor-pointer hover:opacity-80`}
                      title={`${appointment.patientName} - ${appointment.doctorName}`}
                    >
                      <div className="font-medium truncate">
                        {appointment.patientName}
                      </div>
                      <div className="text-xs opacity-90">
                        {appointment.time}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Appointments List
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${getTypeColor(appointment.type)}`}
                   />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.patientName}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {appointment.doctorName} ({appointment.specialty})
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {format(new Date(appointment.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {appointment.time} ({appointment.duration}min)
                      </div>
                      {appointment.room && (
                        <span className="text-gray-500">
                          Room {appointment.room}
                        </span>
                      )}
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/appointments/${appointment.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/appointments/${appointment.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  {appointment.status === 'scheduled' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAppointments.length === 0 && (
          <div className="p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by scheduling your first appointment.'}
            </p>
            <div className="mt-6">
              <Link
                href="/appointments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Appointment
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {appointments.length}
            </div>
            <div className="text-sm text-gray-500">Total Appointments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {appointments.filter((a) => a.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {appointments.filter((a) => a.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
