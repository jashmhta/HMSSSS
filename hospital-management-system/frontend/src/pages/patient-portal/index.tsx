import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  HeartIcon,
  CreditCardIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface PatientPortalProps {
  patientId?: string;
}

interface PatientInfo {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  primaryPhysician: string;
  insuranceProvider: string;
  insuranceNumber: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  type: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  location: string;
  notes?: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  type: string;
  provider: string;
  diagnosis?: string;
  notes?: string;
  documents?: string[];
}

interface Bill {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  description: string;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patientId = "1" }) => {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "records" | "billing" | "messages"
  >("overview");

  useEffect(() => {
    // Simulate API calls
    const fetchPatientData = async () => {
      try {
        setTimeout(() => {
          const mockPatient: PatientInfo = {
            id: "1",
            name: "John Doe",
            dateOfBirth: "1985-03-15",
            gender: "Male",
            phone: "+1-555-0123",
            email: "john.doe@email.com",
            address: "123 Main St, City, State 12345",
            emergencyContact: "Jane Doe (+1-555-0124)",
            bloodType: "O+",
            allergies: ["Penicillin", "Peanuts"],
            primaryPhysician: "Dr. Sarah Johnson",
            insuranceProvider: "Blue Cross Blue Shield",
            insuranceNumber: "BCBS123456789",
          };

          const mockAppointments: Appointment[] = [
            {
              id: "1",
              date: "2025-09-25",
              time: "10:00 AM",
              doctor: "Dr. Sarah Johnson",
              specialty: "Cardiology",
              type: "Follow-up Consultation",
              status: "confirmed",
              location: "Cardiology Clinic, Room 101",
              notes: "Please bring your blood pressure log",
            },
            {
              id: "2",
              date: "2025-10-15",
              time: "2:00 PM",
              doctor: "Dr. Michael Chen",
              specialty: "General Medicine",
              type: "Annual Physical",
              status: "scheduled",
              location: "General Medicine Clinic, Room 205",
            },
          ];

          const mockRecords: MedicalRecord[] = [
            {
              id: "1",
              date: "2025-09-15",
              type: "Consultation",
              provider: "Dr. Sarah Johnson",
              diagnosis: "Hypertension - Well Controlled",
              notes:
                "Blood pressure stable. Continue current medication regimen.",
              documents: ["consultation_notes.pdf"],
            },
            {
              id: "2",
              date: "2025-09-15",
              type: "Laboratory",
              provider: "Lab Services",
              notes: "Complete Blood Count - All values within normal range",
              documents: ["cbc_results.pdf"],
            },
          ];

          const mockBills: Bill[] = [
            {
              id: "1",
              date: "2025-09-15",
              amount: 150.0,
              status: "paid",
              description: "Cardiology Consultation & ECG",
            },
            {
              id: "2",
              date: "2025-09-20",
              amount: 75.0,
              status: "pending",
              description: "Laboratory Tests",
            },
          ];

          setPatient(mockPatient);
          setAppointments(mockAppointments);
          setRecords(mockRecords);
          setBills(mockBills);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== "cancelled" && new Date(apt.date) >= new Date(),
  );

  const pendingBills = bills.filter((bill) => bill.status === "pending");
  const overdueBills = bills.filter((bill) => bill.status === "overdue");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading your health information...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Patient not found
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
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {patient.name}
                </h1>
                <p className="text-gray-600">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <BellIcon className="h-6 w-6" />
                {pendingBills.length + overdueBills.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                )}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
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
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserIcon className="h-5 w-5 mr-3 inline" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "appointments"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CalendarIcon className="h-5 w-5 mr-3 inline" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "records"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-3 inline" />
                Medical Records
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "billing"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CreditCardIcon className="h-5 w-5 mr-3 inline" />
                Billing
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "messages"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
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
                  href="/patient-portal/appointment/book"
                  className="block w-full text-left px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </Link>
                <Link
                  href="/patient-portal/message/new"
                  className="block w-full text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Message Doctor
                </Link>
                <Link
                  href="/patient-portal/records/request"
                  className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Request Records
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Health Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {upcomingAppointments.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Upcoming Appointments
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {records.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Medical Records
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {pendingBills.length}
                      </div>
                      <div className="text-sm text-gray-500">Pending Bills</div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Upcoming Appointments
                  </h3>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <CalendarIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {format(
                                  new Date(appointment.date),
                                  "MMM d, yyyy",
                                )}{" "}
                                at {appointment.time}
                              </div>
                              <div className="text-sm text-gray-600">
                                {appointment.doctor} • {appointment.specialty}
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                appointment.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No upcoming appointments
                    </p>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {records.slice(0, 3).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {record.type}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(record.date), "MMM d, yyyy")} •{" "}
                            {record.provider}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                {(pendingBills.length > 0 || overdueBills.length > 0) && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Payment Required
                        </p>
                        <p className="text-sm text-yellow-700">
                          You have {pendingBills.length + overdueBills.length}{" "}
                          outstanding bill
                          {pendingBills.length + overdueBills.length !== 1
                            ? "s"
                            : ""}
                          .
                          <Link
                            href="/patient-portal/billing"
                            className="ml-1 underline hover:text-yellow-800"
                          >
                            View details
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Appointments
                  </h2>
                  <Link
                    href="/patient-portal/appointment/book"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Book New Appointment
                  </Link>
                </div>

                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.type}
                            </h3>
                            <p className="text-gray-600">
                              {format(
                                new Date(appointment.date),
                                "EEEE, MMMM d, yyyy",
                              )}{" "}
                              at {appointment.time}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.doctor} • {appointment.specialty}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${
                              appointment.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "scheduled"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : appointment.status === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                          {appointment.status === "scheduled" && (
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "records" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Medical Records
                  </h2>
                  <Link
                    href="/patient-portal/records/request"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Request Records
                  </Link>
                </div>

                <div className="space-y-4">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-green-100 p-3 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {record.type}
                            </h3>
                            <p className="text-gray-600">
                              {format(new Date(record.date), "MMMM d, yyyy")} •{" "}
                              {record.provider}
                            </p>
                            {record.diagnosis && (
                              <p className="text-sm text-gray-700 mt-2">
                                <strong>Diagnosis:</strong> {record.diagnosis}
                              </p>
                            )}
                            {record.notes && (
                              <p className="text-sm text-gray-700 mt-1">
                                {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {record.documents && record.documents.length > 0 && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Download ({record.documents.length})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Billing & Payments
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      $
                      {bills
                        .filter((b) => b.status === "paid")
                        .reduce((sum, bill) => sum + bill.amount, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Total Paid</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      $
                      {pendingBills
                        .reduce((sum, bill) => sum + bill.amount, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <div className="text-3xl font-bold text-red-600">
                      $
                      {overdueBills
                        .reduce((sum, bill) => sum + bill.amount, 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Overdue</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {bill.description}
                          </h3>
                          <p className="text-gray-600">
                            {format(new Date(bill.date), "MMMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ${bill.amount.toFixed(2)}
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              bill.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : bill.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                      </div>
                      {bill.status !== "paid" && (
                        <div className="mt-4">
                          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            <CreditCardIcon className="h-4 w-4 mr-2" />
                            Pay Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                  <Link
                    href="/patient-portal/message/new"
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
                      Start a conversation with your healthcare provider.
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

export default PatientPortal;
