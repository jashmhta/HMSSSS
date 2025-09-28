import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  BeakerIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  testCategory:
    | 'hematology'
    | 'biochemistry'
    | 'microbiology'
    | 'immunology'
    | 'pathology';
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
  orderDate: string;
  collectionDate?: string;
  resultDate?: string;
  dueDate: string;
  specimenType: string;
  results?: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: 'normal' | 'high' | 'low' | 'critical';
  }>;
  notes?: string;
  technician?: string;
}

const LaboratoryManagement: React.FC = () => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled'
  >('all');
  const [filterPriority, setFilterPriority] = useState<
    'all' | 'routine' | 'urgent' | 'stat'
  >('all');

  useEffect(() => {
    // Simulate API call
    const fetchTests = async () => {
      try {
        setTimeout(() => {
          const mockTests: LabTest[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              doctorId: '1',
              doctorName: 'Dr. Sarah Johnson',
              testName: 'Complete Blood Count (CBC)',
              testCategory: 'hematology',
              priority: 'routine',
              status: 'completed',
              orderDate: '2025-09-18',
              collectionDate: '2025-09-18',
              resultDate: '2025-09-19',
              dueDate: '2025-09-25',
              specimenType: 'Whole Blood',
              results: [
                {
                  parameter: 'Hemoglobin',
                  value: '14.2',
                  unit: 'g/dL',
                  referenceRange: '13.5-17.5',
                  flag: 'normal',
                },
                {
                  parameter: 'WBC Count',
                  value: '8.5',
                  unit: '×10³/μL',
                  referenceRange: '4.5-11.0',
                  flag: 'normal',
                },
                {
                  parameter: 'Platelets',
                  value: '250',
                  unit: '×10³/μL',
                  referenceRange: '150-450',
                  flag: 'normal',
                },
              ],
              technician: 'Dr. Lisa Wong',
            },
            {
              id: '2',
              patientId: '2',
              patientName: 'Jane Smith',
              doctorId: '2',
              doctorName: 'Dr. Michael Chen',
              testName: 'Lipid Profile',
              testCategory: 'biochemistry',
              priority: 'urgent',
              status: 'processing',
              orderDate: '2025-09-20',
              collectionDate: '2025-09-20',
              dueDate: '2025-09-22',
              specimenType: 'Serum',
              notes: 'Patient has family history of heart disease',
              technician: 'Dr. Robert Kim',
            },
            {
              id: '3',
              patientId: '3',
              patientName: 'Robert Johnson',
              doctorId: '3',
              doctorName: 'Dr. Emily Davis',
              testName: 'Urine Culture',
              testCategory: 'microbiology',
              priority: 'stat',
              status: 'collected',
              orderDate: '2025-09-21',
              collectionDate: '2025-09-21',
              dueDate: '2025-09-21',
              specimenType: 'Urine',
              notes: 'Suspected UTI - start empiric antibiotics',
            },
            {
              id: '4',
              patientId: '1',
              patientName: 'John Doe',
              doctorId: '1',
              doctorName: 'Dr. Sarah Johnson',
              testName: 'HbA1c',
              testCategory: 'biochemistry',
              priority: 'routine',
              status: 'ordered',
              orderDate: '2025-09-21',
              dueDate: '2025-09-28',
              specimenType: 'Whole Blood',
            },
          ];
          setTests(mockTests);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch lab tests:', error);
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'collected':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'stat':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hematology':
        return 'bg-red-100 text-red-800';
      case 'biochemistry':
        return 'bg-blue-100 text-blue-800';
      case 'microbiology':
        return 'bg-green-100 text-green-800';
      case 'immunology':
        return 'bg-purple-100 text-purple-800';
      case 'pathology':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || test.status === filterStatus;
    const matchesPriority =
      filterPriority === 'all' || test.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const urgentTests = tests.filter(
    (test) => test.priority === 'urgent' || test.priority === 'stat',
  );
  const overdueTests = tests.filter(
    (test) =>
      test.status !== 'completed' &&
      test.status !== 'cancelled' &&
      new Date(test.dueDate) < new Date(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading laboratory tests...</p>
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
              Laboratory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Test ordering, processing, and result management
            </p>
          </div>
          <Link
            href="/lab/order"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Order Lab Test
          </Link>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Urgent Tests</p>
              <p className="text-sm text-red-700">
                {urgentTests.length} tests requiring immediate attention
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-orange-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-800">
                Overdue Tests
              </p>
              <p className="text-sm text-orange-700">
                {overdueTests.length} tests past due date
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <BeakerIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Processing</p>
              <p className="text-sm text-blue-700">
                {tests.filter((t) => t.status === 'processing').length} tests
                currently being processed
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
                placeholder="Search by patient name, test name, or doctor..."
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
              <option value="ordered">Ordered</option>
              <option value="collected">Collected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Priority</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Laboratory Tests
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTests.map((test) => (
            <div key={test.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BeakerIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {test.testName}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(test.status)}`}
                      >
                        {test.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(test.priority)}`}
                      >
                        {test.priority}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryColor(test.testCategory)}`}
                      >
                        {test.testCategory}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {test.patientName}
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Ordered by {test.doctorName}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Ordered:{' '}
                        {format(new Date(test.orderDate), 'MMM d, yyyy')}
                      </div>
                      {test.dueDate && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Due: {format(new Date(test.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      Specimen: {test.specimenType}
                      {test.technician && ` • Technician: ${test.technician}`}
                    </div>

                    {test.results && test.results.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Results:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {test.results.map((result, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="text-sm font-medium text-gray-900">
                                {result.parameter}
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {result.value} {result.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ref: {result.referenceRange}
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  result.flag === 'normal'
                                    ? 'text-green-600'
                                    : result.flag === 'critical'
                                      ? 'text-red-600'
                                      : 'text-yellow-600'
                                }`}
                              >
                                {result.flag.toUpperCase()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {test.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">{test.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/lab/test/${test.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/lab/test/${test.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  {test.status === 'ordered' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Collect Sample
                    </button>
                  )}
                  {test.status === 'collected' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <BeakerIcon className="h-4 w-4 mr-1" />
                      Start Processing
                    </button>
                  )}
                  {test.status === 'processing' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Enter Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="p-12 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No lab tests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by ordering your first lab test.'}
            </p>
            <div className="mt-6">
              <Link
                href="/lab/order"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Order Lab Test
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
              {tests.length}
            </div>
            <div className="text-sm text-gray-500">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {tests.filter((t) => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {tests.filter((t) => t.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {tests.filter((t) => t.status === 'ordered').length}
            </div>
            <div className="text-sm text-gray-500">Ordered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {urgentTests.length}
            </div>
            <div className="text-sm text-gray-500">Urgent/STAT</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {overdueTests.length}
            </div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryManagement;
