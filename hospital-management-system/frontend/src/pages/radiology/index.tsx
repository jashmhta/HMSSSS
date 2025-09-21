import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  XRayIcon,
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
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface RadiologyExam {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  examType: "x-ray" | "ct" | "mri" | "ultrasound" | "mammogram" | "fluoroscopy";
  bodyPart: string;
  priority: "routine" | "urgent" | "stat";
  status:
    | "ordered"
    | "scheduled"
    | "in-progress"
    | "completed"
    | "reported"
    | "cancelled";
  orderDate: string;
  scheduledDate?: string;
  completedDate?: string;
  reportDate?: string;
  dueDate: string;
  modality: string;
  contrast: boolean;
  clinicalIndication: string;
  findings?: string;
  impression?: string;
  radiologist?: string;
  technician?: string;
  images?: string[];
  report?: string;
}

const RadiologyManagement: React.FC = () => {
  const [exams, setExams] = useState<RadiologyExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    | "all"
    | "ordered"
    | "scheduled"
    | "in-progress"
    | "completed"
    | "reported"
    | "cancelled"
  >("all");
  const [filterType, setFilterType] = useState<
    "all" | "x-ray" | "ct" | "mri" | "ultrasound" | "mammogram" | "fluoroscopy"
  >("all");

  useEffect(() => {
    // Simulate API call
    const fetchExams = async () => {
      try {
        setTimeout(() => {
          const mockExams: RadiologyExam[] = [
            {
              id: "1",
              patientId: "1",
              patientName: "John Doe",
              doctorId: "1",
              doctorName: "Dr. Sarah Johnson",
              examType: "x-ray",
              bodyPart: "Chest",
              priority: "routine",
              status: "reported",
              orderDate: "2025-09-15",
              scheduledDate: "2025-09-16",
              completedDate: "2025-09-16",
              reportDate: "2025-09-17",
              dueDate: "2025-09-22",
              modality: "Digital X-ray",
              contrast: false,
              clinicalIndication: "Cough and shortness of breath",
              findings:
                "Normal cardiac silhouette. Clear lung fields bilaterally. No pleural effusion.",
              impression: "No acute cardiopulmonary disease.",
              radiologist: "Dr. Mark Thompson",
              technician: "Sarah Wilson",
              images: ["chest_xray_001.jpg", "chest_xray_002.jpg"],
            },
            {
              id: "2",
              patientId: "2",
              patientName: "Jane Smith",
              doctorId: "2",
              doctorName: "Dr. Michael Chen",
              examType: "ct",
              bodyPart: "Abdomen and Pelvis",
              priority: "urgent",
              status: "completed",
              orderDate: "2025-09-19",
              scheduledDate: "2025-09-19",
              completedDate: "2025-09-19",
              dueDate: "2025-09-21",
              modality: "CT Scanner",
              contrast: true,
              clinicalIndication: "Abdominal pain and elevated liver enzymes",
              findings:
                "Liver appears normal in size and attenuation. No focal lesions. Gallbladder is normal. Pancreas appears normal.",
              impression: "No acute abdominal pathology identified.",
              radiologist: "Dr. Lisa Park",
              technician: "Mike Johnson",
            },
            {
              id: "3",
              patientId: "3",
              patientName: "Robert Johnson",
              doctorId: "3",
              doctorName: "Dr. Emily Davis",
              examType: "mri",
              bodyPart: "Knee",
              priority: "routine",
              status: "scheduled",
              orderDate: "2025-09-20",
              scheduledDate: "2025-09-23",
              dueDate: "2025-09-30",
              modality: "MRI Scanner",
              contrast: false,
              clinicalIndication: "Knee pain following injury",
              technician: "Anna Lee",
            },
            {
              id: "4",
              patientId: "4",
              patientName: "Alice Brown",
              doctorId: "4",
              doctorName: "Dr. David Wilson",
              examType: "mammogram",
              bodyPart: "Both Breasts",
              priority: "routine",
              status: "in-progress",
              orderDate: "2025-09-21",
              scheduledDate: "2025-09-21",
              dueDate: "2025-09-28",
              modality: "Mammography Unit",
              contrast: false,
              clinicalIndication: "Screening mammography",
              technician: "Rachel Green",
            },
          ];
          setExams(mockExams);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch radiology exams:", error);
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-indigo-100 text-indigo-800";
      case "reported":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "routine":
        return "bg-gray-100 text-gray-800";
      case "urgent":
        return "bg-orange-100 text-orange-800";
      case "stat":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "x-ray":
        return "bg-blue-100 text-blue-800";
      case "ct":
        return "bg-green-100 text-green-800";
      case "mri":
        return "bg-purple-100 text-purple-800";
      case "ultrasound":
        return "bg-yellow-100 text-yellow-800";
      case "mammogram":
        return "bg-pink-100 text-pink-800";
      case "fluoroscopy":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.examType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || exam.status === filterStatus;
    const matchesType = filterType === "all" || exam.examType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const urgentExams = exams.filter(
    (exam) => exam.priority === "urgent" || exam.priority === "stat",
  );
  const overdueExams = exams.filter(
    (exam) =>
      exam.status !== "completed" &&
      exam.status !== "reported" &&
      exam.status !== "cancelled" &&
      new Date(exam.dueDate) < new Date(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading radiology exams...</p>
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
              Radiology Management
            </h1>
            <p className="text-gray-600 mt-1">
              Imaging requests, scheduling, and report management
            </p>
          </div>
          <Link
            href="/radiology/order"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Order Exam
          </Link>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Urgent Exams</p>
              <p className="text-sm text-red-700">
                {urgentExams.length} exams requiring immediate attention
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-orange-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-800">
                Overdue Exams
              </p>
              <p className="text-sm text-orange-700">
                {overdueExams.length} exams past due date
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <XRayIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">In Progress</p>
              <p className="text-sm text-blue-700">
                {exams.filter((e) => e.status === "in-progress").length} exams
                currently being performed
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
                placeholder="Search by patient name, exam type, body part, or doctor..."
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
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reported">Reported</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="x-ray">X-Ray</option>
              <option value="ct">CT</option>
              <option value="mri">MRI</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="mammogram">Mammogram</option>
              <option value="fluoroscopy">Fluoroscopy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Radiology Exams
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <XRayIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {exam.examType.toUpperCase()} - {exam.bodyPart}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(exam.status)}`}
                      >
                        {exam.status.replace("-", " ")}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(exam.priority)}`}
                      >
                        {exam.priority}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getExamTypeColor(exam.examType)}`}
                      >
                        {exam.examType}
                      </span>
                      {exam.contrast && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Contrast
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {exam.patientName}
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Ordered by {exam.doctorName}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Ordered:{" "}
                        {format(new Date(exam.orderDate), "MMM d, yyyy")}
                      </div>
                      {exam.scheduledDate && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Scheduled:{" "}
                          {format(new Date(exam.scheduledDate), "MMM d, yyyy")}
                        </div>
                      )}
                      {exam.dueDate && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Due: {format(new Date(exam.dueDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      Modality: {exam.modality}
                      {exam.technician && ` • Technician: ${exam.technician}`}
                      {exam.radiologist &&
                        ` • Radiologist: ${exam.radiologist}`}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Indication:</strong> {exam.clinicalIndication}
                    </div>

                    {exam.findings && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Findings:
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {exam.findings}
                        </p>
                      </div>
                    )}

                    {exam.impression && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Impression:
                        </h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded font-medium">
                          {exam.impression}
                        </p>
                      </div>
                    )}

                    {exam.images && exam.images.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <PhotoIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {exam.images.length} images available
                        </span>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View Images
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/radiology/exam/${exam.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/radiology/exam/${exam.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  {exam.status === "ordered" && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Schedule
                    </button>
                  )}
                  {exam.status === "scheduled" && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <XRayIcon className="h-4 w-4 mr-1" />
                      Start Exam
                    </button>
                  )}
                  {exam.status === "completed" && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Create Report
                    </button>
                  )}
                  {exam.status === "completed" && !exam.report && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Finalize Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="p-12 text-center">
            <XRayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No radiology exams found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by ordering your first radiology exam."}
            </p>
            <div className="mt-6">
              <Link
                href="/radiology/order"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Order Radiology Exam
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
              {exams.length}
            </div>
            <div className="text-sm text-gray-500">Total Exams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {exams.filter((e) => e.status === "reported").length}
            </div>
            <div className="text-sm text-gray-500">Reported</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {exams.filter((e) => e.status === "in-progress").length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {exams.filter((e) => e.status === "scheduled").length}
            </div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {urgentExams.length}
            </div>
            <div className="text-sm text-gray-500">Urgent/STAT</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {overdueExams.length}
            </div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyManagement;
