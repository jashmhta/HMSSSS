import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
   UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface EmergencyCase {
  id: string;
  patientId?: string;
  patientName: string;
  age: number;
  gender: string;
  arrivalTime: string;
  triageLevel: 1 | 2 | 3 | 4 | 5; // 1 = Resuscitation, 5 = Non-urgent
  chiefComplaint: string;
  vitalSigns?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    painScale: number;
  };
  status:
    | 'waiting'
    | 'assessment'
    | 'treatment'
    | 'admitted'
    | 'discharged'
    | 'transferred';
  assignedDoctor?: string;
  assignedNurse?: string;
  room?: string;
  diagnosis?: string;
  treatment?: string;
  disposition?: string;
  notes?: string;
  alerts: string[];
}

const EmergencyDepartment: React.FC = () => {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    | 'all'
    | 'waiting'
    | 'assessment'
    | 'treatment'
    | 'admitted'
    | 'discharged'
    | 'transferred'
  >('all');
  const [filterTriage, setFilterTriage] = useState<'all' | 1 | 2 | 3 | 4 | 5>(
    'all',
  );

  useEffect(() => {
    // Simulate API call
    const fetchCases = async () => {
      try {
        setTimeout(() => {
          const mockCases: EmergencyCase[] = [
            {
              id: '1',
              patientName: 'John Doe',
              age: 45,
              gender: 'Male',
              arrivalTime: '2025-09-21T08:30:00Z',
              triageLevel: 1,
              chiefComplaint: 'Chest pain, difficulty breathing',
              vitalSigns: {
                bloodPressure: '180/110',
                heartRate: 120,
                temperature: 98.6,
                respiratoryRate: 28,
                oxygenSaturation: 92,
                painScale: 8,
              },
              status: 'assessment',
              assignedDoctor: 'Dr. Sarah Johnson',
              assignedNurse: 'Nurse Emily Davis',
              room: 'ER-1',
              alerts: [
                'Critical vital signs',
                'Possible MI',
                'Oxygen required',
              ],
            },
            {
              id: '2',
              patientName: 'Jane Smith',
              age: 32,
              gender: 'Female',
              arrivalTime: '2025-09-21T09:15:00Z',
              triageLevel: 2,
              chiefComplaint: 'Severe abdominal pain, vomiting',
              vitalSigns: {
                bloodPressure: '110/70',
                heartRate: 95,
                temperature: 101.2,
                respiratoryRate: 20,
                oxygenSaturation: 98,
                painScale: 9,
              },
              status: 'treatment',
              assignedDoctor: 'Dr. Michael Chen',
              assignedNurse: 'Nurse Robert Wilson',
              room: 'ER-3',
              alerts: ['High fever', 'Dehydration risk'],
            },
            {
              id: '3',
              patientName: 'Robert Johnson',
              age: 28,
              gender: 'Male',
              arrivalTime: '2025-09-21T10:00:00Z',
              triageLevel: 3,
              chiefComplaint: 'Sprained ankle from sports injury',
              vitalSigns: {
                bloodPressure: '120/80',
                heartRate: 75,
                temperature: 98.0,
                respiratoryRate: 16,
                oxygenSaturation: 99,
                painScale: 6,
              },
              status: 'waiting',
              alerts: [],
            },
            {
              id: '4',
              patientName: 'Alice Brown',
              age: 67,
              gender: 'Female',
              arrivalTime: '2025-09-21T07:45:00Z',
              triageLevel: 2,
              chiefComplaint: 'Confusion, headache, vision changes',
              vitalSigns: {
                bloodPressure: '160/95',
                heartRate: 88,
                temperature: 97.8,
                respiratoryRate: 18,
                oxygenSaturation: 96,
                painScale: 4,
              },
              status: 'admitted',
              assignedDoctor: 'Dr. Lisa Park',
              assignedNurse: 'Nurse Anna Lee',
              room: 'ICU-2',
              diagnosis: 'Acute ischemic stroke',
              treatment: 'tPA administration, blood pressure management',
              disposition: 'Admitted to Neurology ICU',
              alerts: [
                'Stroke protocol activated',
                'Time-critical intervention',
              ],
            },
          ];
          setCases(mockCases);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch emergency cases:', error);
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const getTriageColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 4:
        return 'bg-green-100 text-green-800 border-green-300';
      case 5:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTriageLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Level 1 - Resuscitation';
      case 2:
        return 'Level 2 - Emergent';
      case 3:
        return 'Level 3 - Urgent';
      case 4:
        return 'Level 4 - Less Urgent';
      case 5:
        return 'Level 5 - Non-urgent';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'assessment':
        return 'bg-blue-100 text-blue-800';
      case 'treatment':
        return 'bg-purple-100 text-purple-800';
      case 'admitted':
        return 'bg-green-100 text-green-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      case 'transferred':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCases = cases.filter((case_) => {
    const matchesSearch =
      case_.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || case_.status === filterStatus;
    const matchesTriage =
      filterTriage === 'all' || case_.triageLevel === filterTriage;
    return matchesSearch && matchesStatus && matchesTriage;
  });

  const criticalCases = cases.filter((case_) => case_.triageLevel === 1);
  const waitingCases = cases.filter((case_) => case_.status === 'waiting');

  const getWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    return Math.floor(
      (now.getTime() - arrival.getTime()) / (1000 * 60),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading emergency cases...</p>
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
              Emergency Department
            </h1>
            <p className="text-gray-600 mt-1">
              Triage, assessment, and critical care management
            </p>
          </div>
          <Link
            href="/emergency/triage"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Emergency Case
          </Link>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Critical Cases</p>
              <p className="text-sm text-red-700">
                {criticalCases.length} patients requiring immediate attention
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Waiting Patients
              </p>
              <p className="text-sm text-yellow-700">
                {waitingCases.length} patients awaiting assessment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <HeartIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Active Cases</p>
              <p className="text-sm text-blue-700">
                {
                  cases.filter(
                    (c) =>
                      c.status === 'assessment' || c.status === 'treatment',
                  ).length
                }{' '}
                patients in active care
              </p>
            </div>
          </div>
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
                placeholder="Search by patient name or chief complaint..."
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
              <option value="waiting">Waiting</option>
              <option value="assessment">Assessment</option>
              <option value="treatment">Treatment</option>
              <option value="admitted">Admitted</option>
              <option value="discharged">Discharged</option>
              <option value="transferred">Transferred</option>
            </select>
            <select
              value={filterTriage}
              onChange={(e) => setFilterTriage(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Triage Levels</option>
              <option value={1}>Level 1 - Resuscitation</option>
              <option value={2}>Level 2 - Emergent</option>
              <option value={3}>Level 3 - Urgent</option>
              <option value={4}>Level 4 - Less Urgent</option>
              <option value={5}>Level 5 - Non-urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Cases List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Emergency Cases
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredCases.map((case_) => (
            <div key={case_.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-lg border-2 ${getTriageColor(case_.triageLevel)}`}
                  >
                    <span className="text-lg font-bold">
                      {case_.triageLevel}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {case_.patientName}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(case_.status)}`}
                      >
                        {case_.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getTriageColor(case_.triageLevel)}`}
                      >
                        {getTriageLabel(case_.triageLevel)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {case_.age} years • {case_.gender}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Arrived:{' '}
                        {format(new Date(case_.arrivalTime), 'MMM d, HH:mm')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Wait: {getWaitTime(case_.arrivalTime)} min
                      </div>
                      {case_.room && (
                        <span className="text-blue-600 font-medium">
                          Room: {case_.room}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        Chief Complaint:
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {case_.chiefComplaint}
                      </p>
                    </div>

                    {/* Vital Signs */}
                    {case_.vitalSigns && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Vital Signs:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">BP</div>
                            <div className="font-medium">
                              {case_.vitalSigns.bloodPressure}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">HR</div>
                            <div className="font-medium">
                              {case_.vitalSigns.heartRate} bpm
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Temp</div>
                            <div className="font-medium">
                              {case_.vitalSigns.temperature}°F
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">RR</div>
                            <div className="font-medium">
                              {case_.vitalSigns.respiratoryRate}/min
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">O2 Sat</div>
                            <div className="font-medium">
                              {case_.vitalSigns.oxygenSaturation}%
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">Pain</div>
                            <div className="font-medium">
                              {case_.vitalSigns.painScale}/10
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assignment */}
                    {(case_.assignedDoctor || case_.assignedNurse) && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Assigned Staff:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {case_.assignedDoctor && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              👨‍⚕️ {case_.assignedDoctor}
                            </span>
                          )}
                          {case_.assignedNurse && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              👩‍⚕️ {case_.assignedNurse}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    {case_.alerts.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-red-900 mb-1">
                          Critical Alerts:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {case_.alerts.map((alert, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                            >
                              ⚠️ {alert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diagnosis and Treatment */}
                    {(case_.diagnosis || case_.treatment) && (
                      <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {case_.diagnosis && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Diagnosis:
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {case_.diagnosis}
                            </p>
                          </div>
                        )}
                        {case_.treatment && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Treatment:
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {case_.treatment}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Disposition */}
                    {case_.disposition && (
                      <div className="mb-3 p-3 bg-blue-50 rounded">
                        <h4 className="text-sm font-medium text-blue-900">
                          Disposition:
                        </h4>
                        <p className="text-sm text-blue-800 mt-1">
                          {case_.disposition}
                        </p>
                      </div>
                    )}

                    {case_.notes && (
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">{case_.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/emergency/${case_.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/emergency/${case_.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  {case_.status === 'waiting' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Assign
                    </button>
                  )}
                  {(case_.status === 'assessment' ||
                    case_.status === 'treatment') && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Discharge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="p-12 text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No emergency cases found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterTriage !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No active emergency cases at this time.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Emergency Department Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {cases.length}
            </div>
            <div className="text-sm text-gray-500">Total Cases</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {criticalCases.length}
            </div>
            <div className="text-sm text-gray-500">Critical (Level 1-2)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {waitingCases.length}
            </div>
            <div className="text-sm text-gray-500">Waiting</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {cases.filter((c) => c.status === 'treatment').length}
            </div>
            <div className="text-sm text-gray-500">In Treatment</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {cases.filter((c) => c.status === 'admitted').length}
            </div>
            <div className="text-sm text-gray-500">Admitted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {cases.filter((c) => c.status === 'discharged').length}
            </div>
            <div className="text-sm text-gray-500">Discharged</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDepartment;
