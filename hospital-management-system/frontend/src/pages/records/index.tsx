import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  BeakerIcon,
  ViewfinderCircleIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  recordType: 'visit' | 'lab' | 'radiology' | 'prescription' | 'procedure';
  date: string;
  provider: string;
  specialty: string;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  attachments?: string[];
  status: 'draft' | 'final' | 'amended';
}

interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisit: string;
  totalRecords: number;
}

const MedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'visit' | 'lab' | 'radiology' | 'prescription' | 'procedure'
  >('all');

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setTimeout(() => {
          const mockPatients: PatientSummary[] = [
            {
              id: '1',
              name: 'John Doe',
              age: 40,
              gender: 'Male',
              bloodType: 'O+',
              allergies: ['Penicillin', 'Peanuts'],
              chronicConditions: ['Hypertension', 'Diabetes'],
              lastVisit: '2025-09-15',
              totalRecords: 12,
            },
            {
              id: '2',
              name: 'Jane Smith',
              age: 35,
              gender: 'Female',
              bloodType: 'A-',
              allergies: ['Sulfa drugs'],
              chronicConditions: ['Asthma'],
              lastVisit: '2025-09-10',
              totalRecords: 8,
            },
          ];

          const mockRecords: MedicalRecord[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              recordType: 'visit',
              date: '2025-09-15',
              provider: 'Dr. Sarah Johnson',
              specialty: 'Cardiology',
              diagnosis: 'Hypertension - Stage 2',
              symptoms: 'Headache, dizziness, fatigue',
              treatment: 'Lifestyle modifications, medication adjustment',
              medications: [
                'Lisinopril 10mg daily',
                'Metformin 500mg twice daily',
              ],
              notes:
                'Patient reports improved compliance with medication. Blood pressure controlled.',
              status: 'final',
            },
            {
              id: '2',
              patientId: '1',
              patientName: 'John Doe',
              recordType: 'lab',
              date: '2025-09-15',
              provider: 'Dr. Sarah Johnson',
              specialty: 'Cardiology',
              diagnosis: 'Routine blood work',
              notes: 'CBC, Lipid panel, HbA1c - All within normal limits',
              attachments: ['lab_results_2025-09-15.pdf'],
              status: 'final',
            },
            {
              id: '3',
              patientId: '2',
              patientName: 'Jane Smith',
              recordType: 'visit',
              date: '2025-09-10',
              provider: 'Dr. Michael Chen',
              specialty: 'Pulmonology',
              diagnosis: 'Asthma exacerbation',
              symptoms: 'Shortness of breath, wheezing, chest tightness',
              treatment: 'Inhaled bronchodilators, oral steroids',
              medications: [
                'Albuterol inhaler PRN',
                'Prednisone 40mg daily x5 days',
              ],
              notes:
                'Patient educated on proper inhaler technique. Follow-up in 2 weeks.',
              status: 'final',
            },
          ];

          setPatients(mockPatients);
          setRecords(mockRecords);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch medical records:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return DocumentTextIcon;
      case 'lab':
        return BeakerIcon;
      case 'radiology':
        return ViewfinderCircleIcon;
      case 'prescription':
        return HeartIcon;
      case 'procedure':
        return ClipboardDocumentListIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-green-100 text-green-800';
      case 'radiology':
        return 'bg-purple-100 text-purple-800';
      case 'prescription':
        return 'bg-yellow-100 text-yellow-800';
      case 'procedure':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'amended':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesPatient =
      !selectedPatient || record.patientId === selectedPatient;
    const matchesType =
      filterType === 'all' || record.recordType === filterType;
    const matchesSearch =
      !searchTerm ||
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis &&
        record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPatient && matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading medical records...</p>
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
              Medical Records
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive patient medical history and documentation
            </p>
          </div>
          <Link
            href="/records/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Record
          </Link>
        </div>
      </div>

      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`bg-white rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-colors ${
              selectedPatient === patient.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() =>
              setSelectedPatient(
                selectedPatient === patient.id ? '' : patient.id,
              )
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {patient.age} years • {patient.gender} • Blood Type:{' '}
                    {patient.bloodType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Records</div>
                <div className="text-2xl font-bold text-blue-600">
                  {patient.totalRecords}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Allergies:</span>
                <div className="mt-1">
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-600">None</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Chronic Conditions:</span>
                <div className="mt-1">
                  {patient.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-600">None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Visit:</span>
                <span className="font-medium">
                  {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        ))}
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
                placeholder="Search records by patient, provider, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="visit">Visit Notes</option>
              <option value="lab">Lab Results</option>
              <option value="radiology">Radiology</option>
              <option value="prescription">Prescriptions</option>
              <option value="procedure">Procedures</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Medical Records{' '}
            {selectedPatient &&
              `for ${patients.find((p) => p.id === selectedPatient)?.name}`}
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRecords.map((record) => {
            const Icon = getRecordTypeIcon(record.recordType);
            return (
              <div key={record.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-2 rounded-lg ${getRecordTypeColor(record.recordType).split(' ')[0]}`}
                    >
                      <Icon className="h-5 w-5 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {record.patientName}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getRecordTypeColor(record.recordType)}`}
                        >
                          {record.recordType}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {record.provider}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </div>
                        <span className="text-gray-500">
                          {record.specialty}
                        </span>
                      </div>

                      {record.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Diagnosis:{' '}
                          </span>
                          <span className="text-sm text-gray-600">
                            {record.diagnosis}
                          </span>
                        </div>
                      )}

                      {record.symptoms && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Symptoms:{' '}
                          </span>
                          <span className="text-sm text-gray-600">
                            {record.symptoms}
                          </span>
                        </div>
                      )}

                      {record.treatment && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Treatment:{' '}
                          </span>
                          <span className="text-sm text-gray-600">
                            {record.treatment}
                          </span>
                        </div>
                      )}

                      {record.medications && record.medications.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Medications:{' '}
                          </span>
                          <div className="inline-flex flex-wrap gap-1 mt-1">
                            {record.medications.map((medication, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {medication}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Notes:{' '}
                          </span>
                          <span className="text-sm text-gray-600">
                            {record.notes}
                          </span>
                        </div>
                      )}

                      {record.attachments && record.attachments.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            Attachments:
                          </span>
                          {record.attachments.map((attachment, index) => (
                            <button
                              key={index}
                              className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                              {attachment}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/records/${record.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <Link
                      href={`/records/${record.id}/edit`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No medical records found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || selectedPatient
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first medical record.'}
            </p>
            <div className="mt-6">
              <Link
                href="/records/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Medical Record
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {records.length}
            </div>
            <div className="text-sm text-gray-500">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {records.filter((r) => r.recordType === 'visit').length}
            </div>
            <div className="text-sm text-gray-500">Visit Notes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {records.filter((r) => r.recordType === 'lab').length}
            </div>
            <div className="text-sm text-gray-500">Lab Results</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {records.filter((r) => r.recordType === 'radiology').length}
            </div>
            <div className="text-sm text-gray-500">Radiology</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {records.filter((r) => r.recordType === 'prescription').length}
            </div>
            <div className="text-sm text-gray-500">Prescriptions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {records.filter((r) => r.status === 'final').length}
            </div>
            <div className="text-sm text-gray-500">Final Records</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;
