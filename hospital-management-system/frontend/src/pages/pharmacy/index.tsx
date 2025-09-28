import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  HeartIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
   ClockIcon,
   ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'inhaler';
  strength: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  status: 'active' | 'discontinued' | 'expired' | 'low_stock';
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: Array<{
    medicationId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }>;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
  notes?: string;
}

const PharmacyManagement: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>(
    'inventory',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'low_stock' | 'expired' | 'discontinued'
  >('all');

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setTimeout(() => {
          const mockMedications: Medication[] = [
            {
              id: '1',
              name: 'Lisinopril',
              genericName: 'Lisinopril',
              category: 'ACE Inhibitor',
              dosage: '10mg',
              form: 'tablet',
              strength: '10mg',
              manufacturer: 'Generic Pharma',
              batchNumber: 'LP2025001',
              expiryDate: '2026-12-31',
              stockQuantity: 150,
              reorderLevel: 50,
              unitPrice: 0.25,
              status: 'active',
            },
            {
              id: '2',
              name: 'Metformin',
              genericName: 'Metformin HCl',
              category: 'Antidiabetic',
              dosage: '500mg',
              form: 'tablet',
              strength: '500mg',
              manufacturer: 'MediCorp',
              batchNumber: 'MT2025002',
              expiryDate: '2026-08-15',
              stockQuantity: 25,
              reorderLevel: 50,
              unitPrice: 0.15,
              status: 'low_stock',
            },
            {
              id: '3',
              name: 'Amoxicillin',
              genericName: 'Amoxicillin',
              category: 'Antibiotic',
              dosage: '500mg',
              form: 'capsule',
              strength: '500mg',
              manufacturer: 'PharmaPlus',
              batchNumber: 'AM2024001',
              expiryDate: '2025-06-30',
              stockQuantity: 0,
              reorderLevel: 100,
              unitPrice: 0.35,
              status: 'expired',
            },
          ];

          const mockPrescriptions: Prescription[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              doctorId: '1',
              doctorName: 'Dr. Sarah Johnson',
              date: '2025-09-20',
              medications: [
                {
                  medicationId: '1',
                  medicationName: 'Lisinopril 10mg',
                  dosage: '10mg',
                  frequency: 'Once daily',
                  duration: '30 days',
                  quantity: 30,
                  instructions: 'Take with food',
                },
                {
                  medicationId: '2',
                  medicationName: 'Metformin 500mg',
                  dosage: '500mg',
                  frequency: 'Twice daily',
                  duration: '30 days',
                  quantity: 60,
                  instructions: 'Take with meals',
                },
              ],
              status: 'pending',
              notes: 'Patient has hypertension and diabetes',
            },
            {
              id: '2',
              patientId: '2',
              patientName: 'Jane Smith',
              doctorId: '2',
              doctorName: 'Dr. Michael Chen',
              date: '2025-09-18',
              medications: [
                {
                  medicationId: '4',
                  medicationName: 'Albuterol Inhaler',
                  dosage: '90mcg',
                  frequency: 'As needed',
                  duration: 'PRN',
                  quantity: 1,
                  instructions: 'Use during asthma attacks',
                },
              ],
              status: 'filled',
            },
          ];

          setMedications(mockMedications);
          setPrescriptions(mockPrescriptions);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch pharmacy data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrescriptionStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'partially_filled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMedications = medications.filter((medication) => {
    const matchesSearch =
      medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || medication.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const lowStockMedications = medications.filter(
    (med) => med.stockQuantity <= med.reorderLevel,
  );
  const expiredMedications = medications.filter(
    (med) => new Date(med.expiryDate) < new Date(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading pharmacy data...</p>
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
              Pharmacy Management
            </h1>
            <p className="text-gray-600 mt-1">
              Inventory management and prescription processing
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/pharmacy/inventory/add"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Medication
            </Link>
            <Link
              href="/pharmacy/prescription/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Prescription
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </p>
              <p className="text-sm text-yellow-700">
                {lowStockMedications.length} medications below reorder level
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Expired Medications
              </p>
              <p className="text-sm text-red-700">
                {expiredMedications.length} medications expired
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Pending Prescriptions
              </p>
              <p className="text-sm text-blue-700">
                {prescriptions.filter((p) => p.status === 'pending').length}{' '}
                prescriptions awaiting fulfillment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArchiveBoxIcon className="h-5 w-5 mr-2 inline" />
              Inventory ({medications.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prescriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HeartIcon className="h-5 w-5 mr-2 inline" />
              Prescriptions ({prescriptions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search medications by name, generic name, or category..."
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
                    <option value="active">Active</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="expired">Expired</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMedications.map((medication) => (
                      <tr key={medication.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {medication.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {medication.genericName} • {medication.dosage}
                            </div>
                            <div className="text-xs text-gray-400">
                              {medication.category} • {medication.form}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {medication.stockQuantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            Reorder: {medication.reorderLevel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(medication.expiryDate), 'MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${medication.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(medication.status)}`}
                          >
                            {medication.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/pharmacy/inventory/${medication.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/pharmacy/inventory/${medication.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              {/* Prescriptions List */}
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="bg-gray-50 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {prescription.patientName}
                          </h3>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPrescriptionStatusColor(prescription.status)}`}
                          >
                            {prescription.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Prescribed by {prescription.doctorName} on{' '}
                          {format(new Date(prescription.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/pharmacy/prescription/${prescription.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        {prescription.status === 'pending' && (
                          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Fill Prescription
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {prescription.medications.map((med, index) => (
                        <div
                          key={index}
                          className="bg-white rounded p-4 border"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {med.medicationName}
                              </h4>
                              <div className="text-sm text-gray-600 mt-1">
                                {med.dosage} • {med.frequency} • {med.duration}{' '}
                                • Quantity: {med.quantity}
                              </div>
                              {med.instructions && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Instructions: {med.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {prescription.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          {prescription.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {medications.length}
            </div>
            <div className="text-sm text-gray-500">Total Medications</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {medications.filter((m) => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {lowStockMedications.length}
            </div>
            <div className="text-sm text-gray-500">Low Stock</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {expiredMedications.length}
            </div>
            <div className="text-sm text-gray-500">Expired</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {prescriptions.length}
            </div>
            <div className="text-sm text-gray-500">Total Prescriptions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {prescriptions.filter((p) => p.status === 'filled').length}
            </div>
            <div className="text-sm text-gray-500">Filled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyManagement;
