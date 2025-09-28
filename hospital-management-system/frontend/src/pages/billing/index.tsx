import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  CurrencyDollarIcon,
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
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  billDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  balance: number;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category:
      | 'consultation'
      | 'procedure'
      | 'medication'
      | 'lab'
      | 'radiology'
      | 'room'
      | 'other';
  }>;
  insurance?: {
    provider: string;
    policyNumber: string;
    coverage: number;
    approvedAmount: number;
    paidAmount: number;
  };
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'check';
    reference?: string;
  }>;
}

const BillingManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  >('all');

  useEffect(() => {
    // Simulate API call
    const fetchBills = async () => {
      try {
        setTimeout(() => {
          const mockBills: Bill[] = [
            {
              id: '1',
              patientId: '1',
              patientName: 'John Doe',
              invoiceNumber: 'INV-2025-001',
              billDate: '2025-09-15',
              dueDate: '2025-10-15',
              status: 'paid',
              totalAmount: 450.0,
              paidAmount: 450.0,
              balance: 0.0,
              items: [
                {
                  id: '1',
                  description: 'Cardiology Consultation',
                  quantity: 1,
                  unitPrice: 200.0,
                  total: 200.0,
                  category: 'consultation',
                },
                {
                  id: '2',
                  description: 'ECG',
                  quantity: 1,
                  unitPrice: 150.0,
                  total: 150.0,
                  category: 'procedure',
                },
                {
                  id: '3',
                  description: 'Blood Tests',
                  quantity: 1,
                  unitPrice: 100.0,
                  total: 100.0,
                  category: 'lab',
                },
              ],
              insurance: {
                provider: 'Blue Cross Blue Shield',
                policyNumber: 'BCBS123456',
                coverage: 80,
                approvedAmount: 360.0,
                paidAmount: 360.0,
              },
              payments: [
                {
                  id: '1',
                  date: '2025-09-16',
                  amount: 360.0,
                  method: 'insurance',
                  reference: 'CLAIM-001',
                },
                {
                  id: '2',
                  date: '2025-09-16',
                  amount: 90.0,
                  method: 'card',
                  reference: 'TXN-12345',
                },
              ],
            },
            {
              id: '2',
              patientId: '2',
              patientName: 'Jane Smith',
              invoiceNumber: 'INV-2025-002',
              billDate: '2025-09-18',
              dueDate: '2025-10-18',
              status: 'sent',
              totalAmount: 320.0,
              paidAmount: 0.0,
              balance: 320.0,
              items: [
                {
                  id: '1',
                  description: 'General Consultation',
                  quantity: 1,
                  unitPrice: 150.0,
                  total: 150.0,
                  category: 'consultation',
                },
                {
                  id: '2',
                  description: 'Spirometry',
                  quantity: 1,
                  unitPrice: 120.0,
                  total: 120.0,
                  category: 'procedure',
                },
                {
                  id: '3',
                  description: 'Albuterol Inhaler',
                  quantity: 1,
                  unitPrice: 50.0,
                  total: 50.0,
                  category: 'medication',
                },
              ],
              insurance: {
                provider: 'Aetna',
                policyNumber: 'AET789012',
                coverage: 70,
                approvedAmount: 224.0,
                paidAmount: 0.0,
              },
              payments: [],
            },
            {
              id: '3',
              patientId: '3',
              patientName: 'Robert Johnson',
              invoiceNumber: 'INV-2025-003',
              billDate: '2025-09-10',
              dueDate: '2025-10-10',
              status: 'overdue',
              totalAmount: 1250.0,
              paidAmount: 500.0,
              balance: 750.0,
              items: [
                {
                  id: '1',
                  description: 'Orthopedic Consultation',
                  quantity: 1,
                  unitPrice: 300.0,
                  total: 300.0,
                  category: 'consultation',
                },
                {
                  id: '2',
                  description: 'Knee MRI',
                  quantity: 1,
                  unitPrice: 800.0,
                  total: 800.0,
                  category: 'radiology',
                },
                {
                  id: '3',
                  description: 'Pain Medication',
                  quantity: 1,
                  unitPrice: 150.0,
                  total: 150.0,
                  category: 'medication',
                },
              ],
              payments: [
                {
                  id: '1',
                  date: '2025-09-12',
                  amount: 500.0,
                  method: 'bank_transfer',
                  reference: 'BT-67890',
                },
              ],
            },
          ];
          setBills(mockBills);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch bills:', error);
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'procedure':
        return 'bg-green-100 text-green-800';
      case 'medication':
        return 'bg-purple-100 text-purple-800';
      case 'lab':
        return 'bg-yellow-100 text-yellow-800';
      case 'radiology':
        return 'bg-pink-100 text-pink-800';
      case 'room':
        return 'bg-indigo-100 text-indigo-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'insurance':
        return '🏥';
      case 'check':
        return '📝';
      default:
        return '💰';
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const overdueBills = bills.filter((bill) => bill.status === 'overdue');
  const pendingPayments = bills.filter(
    (bill) => bill.balance > 0 && bill.status !== 'cancelled',
  );

  const totalRevenue = bills
    .filter((bill) => bill.status === 'paid')
    .reduce((sum, bill) => sum + bill.paidAmount, 0);

  const outstandingAmount = bills
    .filter((bill) => bill.status !== 'paid' && bill.status !== 'cancelled')
    .reduce((sum, bill) => sum + bill.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading billing data...</p>
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
              Billing & Invoicing
            </h1>
            <p className="text-gray-600 mt-1">
              Financial management and payment processing
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/billing/create"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Bill
            </Link>
            <Link
              href="/billing/payment"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Record Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${outstandingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Bills</p>
              <p className="text-2xl font-bold text-gray-900">
                {overdueBills.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Payments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingPayments.length}
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
                placeholder="Search by patient name or invoice number..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Invoices & Bills
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {bill.invoiceNumber}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(bill.status)}`}
                      >
                        {bill.status}
                      </span>
                      {bill.status === 'overdue' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {bill.patientName}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Bill Date:{' '}
                        {format(new Date(bill.billDate), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Bill Items */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Bill Items:
                      </h4>
                      <div className="space-y-1">
                        {bill.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryColor(item.category)}`}
                              >
                                {item.category}
                              </span>
                              <span>{item.description}</span>
                              <span className="text-gray-500">
                                ×{item.quantity}
                              </span>
                            </div>
                            <span className="font-medium">
                              ${item.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div className="text-center">
                        <span className="text-gray-500">Total</span>
                        <div className="font-bold text-gray-900">
                          ${bill.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500">Paid</span>
                        <div className="font-bold text-green-600">
                          ${bill.paidAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500">Balance</span>
                        <div
                          className={`font-bold ${bill.balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          ${bill.balance.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Insurance Info */}
                    {bill.insurance && (
                      <div className="mb-3 p-3 bg-blue-50 rounded">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          Insurance
                        </h4>
                        <div className="text-xs text-blue-800">
                          {bill.insurance.provider} • Policy:{' '}
                          {bill.insurance.policyNumber} • Coverage:{' '}
                          {bill.insurance.coverage}%
                        </div>
                      </div>
                    )}

                    {/* Payments */}
                    {bill.payments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Payments:
                        </h4>
                        <div className="space-y-1">
                          {bill.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between text-sm bg-green-50 p-2 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                <span>
                                  {getPaymentMethodIcon(payment.method)}
                                </span>
                                <span>
                                  {format(
                                    new Date(payment.date),
                                    'MMM d, yyyy',
                                  )}
                                </span>
                                {payment.reference && (
                                  <span className="text-gray-500">
                                    ({payment.reference})
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-green-600">
                                ${payment.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/billing/${bill.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/billing/${bill.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  {bill.balance > 0 && bill.status !== 'cancelled' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CreditCardIcon className="h-4 w-4 mr-1" />
                      Pay
                    </button>
                  )}
                  {bill.status === 'draft' && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBills.length === 0 && (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No bills found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first bill.'}
            </p>
            <div className="mt-6">
              <Link
                href="/billing/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Bill
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
              {bills.length}
            </div>
            <div className="text-sm text-gray-500">Total Bills</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {bills.filter((b) => b.status === 'paid').length}
            </div>
            <div className="text-sm text-gray-500">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {bills.filter((b) => b.status === 'sent').length}
            </div>
            <div className="text-sm text-gray-500">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {overdueBills.length}
            </div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {bills.filter((b) => b.insurance).length}
            </div>
            <div className="text-sm text-gray-500">With Insurance</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {bills.filter((b) => b.payments.length > 0).length}
            </div>
            <div className="text-sm text-gray-500">Partially Paid</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;
