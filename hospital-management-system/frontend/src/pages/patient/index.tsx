import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  medicalRecordNumber: string;
  status: 'active' | 'inactive';
  lastVisit: string;
  nextAppointment?: string;
}

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  useEffect(() => {
    // Simulate API call
    const fetchPatients = async () => {
      try {
        setTimeout(() => {
          const mockPatients: Patient[] = [
            {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1985-03-15',
              gender: 'Male',
              phone: '+1-555-0123',
              email: 'john.doe@email.com',
              address: '123 Main St, City, State 12345',
              emergencyContact: 'Jane Doe (+1-555-0124)',
              bloodType: 'O+',
              allergies: ['Penicillin', 'Peanuts'],
              medicalRecordNumber: 'MRN001234',
              status: 'active',
              lastVisit: '2025-09-15',
              nextAppointment: '2025-09-25',
            },
            {
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              dateOfBirth: '1990-07-22',
              gender: 'Female',
              phone: '+1-555-0125',
              email: 'jane.smith@email.com',
              address: '456 Oak Ave, City, State 12346',
              emergencyContact: 'Bob Smith (+1-555-0126)',
              bloodType: 'A-',
              allergies: ['Sulfa drugs'],
              medicalRecordNumber: 'MRN001235',
              status: 'active',
              lastVisit: '2025-09-10',
            },
            {
              id: '3',
              firstName: 'Robert',
              lastName: 'Johnson',
              dateOfBirth: '1978-11-08',
              gender: 'Male',
              phone: '+1-555-0127',
              email: 'robert.johnson@email.com',
              address: '789 Pine Rd, City, State 12347',
              emergencyContact: 'Mary Johnson (+1-555-0128)',
              bloodType: 'B+',
              allergies: [],
              medicalRecordNumber: 'MRN001236',
              status: 'inactive',
              lastVisit: '2025-06-20',
            },
          ];
          setPatients(mockPatients);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      `${patient.firstName} ${patient.lastName} ${patient.medicalRecordNumber}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading patients...</p>
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
              Patient Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage patient records and information
            </p>
          </div>
          <Link
            href="/patient/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Patient
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Patients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {patient.firstName[0]}
                      {patient.lastName[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      MRN: {patient.medicalRecordNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(patient.status)}`}
                >
                  {patient.status}
                </span>
              </div>

              {/* Patient Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {new Date().getFullYear() -
                    new Date(patient.dateOfBirth).getFullYear()}{' '}
                  years old • {patient.gender}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {patient.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {patient.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {patient.address.split(',')[0]}
                </div>
              </div>

              {/* Medical Info */}
              <div className="border-t pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Blood Type:</span>
                    <span className="ml-1 font-medium">
                      {patient.bloodType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Allergies:</span>
                    <span className="ml-1 font-medium">
                      {patient.allergies.length || 'None'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Last Visit:</span>
                  <span className="ml-1 font-medium">
                    {new Date(patient.lastVisit).toLocaleDateString()}
                  </span>
                </div>
                {patient.nextAppointment && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-500">Next Appointment:</span>
                    <span className="ml-1 font-medium text-blue-600">
                      {new Date(patient.nextAppointment).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/patient/${patient.id}`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
                <Link
                  href={`/patient/${patient.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No patients found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first patient.'}
          </p>
          <div className="mt-6">
            <Link
              href="/patient/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Patient
            </Link>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {patients.length}
            </div>
            <div className="text-sm text-gray-500">Total Patients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {patients.filter((p) => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active Patients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {patients.filter((p) => p.nextAppointment).length}
            </div>
            <div className="text-sm text-gray-500">Upcoming Appointments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {patients.filter((p) => p.allergies.length > 0).length}
            </div>
            <div className="text-sm text-gray-500">Patients with Allergies</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientManagement;
