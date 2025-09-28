/*[object Object]*/
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrescriptionStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

import {
  CreateIPDAdmissionDto,
  ProgressNoteDto,
  VitalSignsDto,
  NursingNoteDto,
  DischargePatientDto,
  TransferPatientDto,
  BedInfoDto,
  AdmissionType,
  AdmissionPriority,
  WardType,
  DischargeType,
  NoteType,
  ShiftType,
} from './dto/ipd-admission.dto';
import {
  ICUTransferDto,
  ICUProgressNoteDto,
  ICUDischargeReadinessDto,
  ICUAssessmentDto,
} from './dto/icu-management.dto';

/**
 *
 */
@Injectable()
export class IPDService {
  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  // Mock bed and ward data - in a real implementation, this would be in the database
  private mockBeds: BedInfoDto[] = [
    {
      id: 'bed-1',
      bedNumber: '101-A',
      roomNumber: '101',
      wardType: WardType.GENERAL,
      status: 'AVAILABLE',
    },
    {
      id: 'bed-2',
      bedNumber: '101-B',
      roomNumber: '101',
      wardType: WardType.GENERAL,
      status: 'AVAILABLE',
    },
    {
      id: 'bed-3',
      bedNumber: '201-A',
      roomNumber: '201',
      wardType: WardType.PRIVATE,
      status: 'AVAILABLE',
    },
    {
      id: 'bed-4',
      bedNumber: '301-A',
      roomNumber: '301',
      wardType: WardType.ICU,
      status: 'AVAILABLE',
    },
    {
      id: 'bed-5',
      bedNumber: '301-B',
      roomNumber: '301',
      wardType: WardType.ICU,
      status: 'AVAILABLE',
    },
  ];

  /**
   *
   */
  async admitPatient(data: CreateIPDAdmissionDto) {
    return this.admitPatientToIPD({
      ...data,
      admittedBy: 'system', // This should be passed from the controller
    });
  }

  /**
   *
   */
  async getIPDAdmissions() {
    // Using MedicalRecord model to store IPD admissions with specialized type
    // Since we can't query JSON fields directly, we'll use a marker in the notes field
    const admissions = await this.prisma.medicalRecord.findMany({
      where: {
        notes: {
          contains: 'IPD_ADMISSION',
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    // Transform the data to match expected IPD admission format
    return admissions.map(record => this.transformMedicalRecordToIPDAdmission(record));
  }

  /**
   *
   */
  async getIPDAdmissionById(id: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    return this.transformMedicalRecordToIPDAdmission(record);
  }

  /**
   *
   */
  async updateAdmission(id: string, data: any) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const existingTreatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    const updatedTreatmentPlan = {
      ...existingTreatmentPlan,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const updatedRecord = await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        treatmentPlan: JSON.stringify(updatedTreatmentPlan),
        updatedAt: new Date(),
      },
    });

    return this.transformMedicalRecordToIPDAdmission(updatedRecord);
  }

  /**
   *
   */
  async getBedOccupancy() {
    // Get all active IPD admissions
    const activeAdmissions = await this.prisma.medicalRecord.findMany({
      where: {
        notes: {
          contains: 'IPD_ADMISSION',
        },
        diagnosis: {
          has: 'ADMITTED', // Using diagnosis array to store status
        },
      },
    });

    // Update mock bed status based on admissions
    this.mockBeds = this.mockBeds.map(bed => {
      const isOccupied = activeAdmissions.some(admission => {
        const treatmentPlan = admission.treatmentPlan ? JSON.parse(admission.treatmentPlan) : null;
        return treatmentPlan?.bedAssignment?.bedId === bed.id;
      });
      return { ...bed, status: isOccupied ? 'OCCUPIED' : 'AVAILABLE' };
    });

    return this.mockBeds.map(bed => ({
      ...bed,
      currentAdmission:
        bed.status === 'OCCUPIED'
          ? activeAdmissions.find(admission => {
              const treatmentPlan = admission.treatmentPlan
                ? JSON.parse(admission.treatmentPlan)
                : null;
              return treatmentPlan?.bedAssignment?.bedId === bed.id;
            })
          : null,
    }));
  }

  /**
   *
   */
  async assignBed(admissionId: string, bedId: string) {
    const bed = this.mockBeds.find(b => b.id === bedId);
    if (!bed || bed.status !== 'AVAILABLE') {
      throw new BadRequestException('Bed is not available');
    }

    return this.updateAdmission(admissionId, {
      bedAssignment: {
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        roomNumber: bed.roomNumber,
        wardType: bed.wardType,
        assignedAt: new Date(),
      },
    });
  }

  /**
   *
   */
  async addProgressNote(admissionId: string, noteData: ProgressNoteDto & { notedBy: string }) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: admissionId },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    const progressNotes = treatmentPlan.progressNotes || [];

    const newNote = {
      id: `note-${Date.now()}`,
      ...noteData,
      notedAt: new Date().toISOString(),
    };

    progressNotes.push(newNote);
    treatmentPlan.progressNotes = progressNotes;
    treatmentPlan.lastProgressNote = new Date().toISOString();

    await this.prisma.medicalRecord.update({
      where: { id: admissionId },
      data: {
        treatmentPlan: JSON.stringify(treatmentPlan),
        updatedAt: new Date(),
      },
    });

    // Log progress note
    await this.complianceService.logAuditEvent({
      userId: noteData.notedBy,
      action: 'PROGRESS_NOTE_ADDED',
      resource: 'medical_records',
      resourceId: admissionId,
      details: {
        admissionId,
        noteType: noteData.noteType,
        private: noteData.private || false,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return newNote;
  }

  /**
   *
   */
  async addNursingNote(admissionId: string, noteData: NursingNoteDto & { notedBy: string }) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: admissionId },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    const nursingNotes = treatmentPlan.nursingNotes || [];

    const newNote = {
      id: `nursing-${Date.now()}`,
      ...noteData,
      notedAt: new Date().toISOString(),
    };

    nursingNotes.push(newNote);
    treatmentPlan.nursingNotes = nursingNotes;

    await this.prisma.medicalRecord.update({
      where: { id: admissionId },
      data: {
        treatmentPlan: JSON.stringify(treatmentPlan),
        updatedAt: new Date(),
      },
    });

    // Log nursing note
    await this.complianceService.logAuditEvent({
      userId: noteData.notedBy,
      action: 'NURSING_NOTE_ADDED',
      resource: 'medical_records',
      resourceId: admissionId,
      details: {
        admissionId,
        shift: noteData.shift,
        activitiesCount: noteData.activities.length,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return newNote;
  }

  /**
   * Admit patient to IPD with comprehensive validation
   */
  async admitPatientToIPD(admissionData: CreateIPDAdmissionDto & { admittedBy: string }) {
    // Validate patient exists and is not already admitted
    const patient = await this.prisma.patient.findUnique({
      where: { id: admissionData.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check for existing active IPD admission
    const existingAdmission = await this.prisma.medicalRecord.findFirst({
      where: {
        patientId: admissionData.patientId,
        notes: {
          contains: 'IPD_ADMISSION',
        },
        diagnosis: {
          has: 'ADMITTED',
        },
      },
    });

    if (existingAdmission) {
      throw new ConflictException('Patient is already admitted to IPD');
    }

    // Find available bed in requested ward type
    const availableBed = await this.findAvailableBed(admissionData.wardType);
    if (!availableBed) {
      throw new BadRequestException(`No beds available in ${admissionData.wardType} ward`);
    }

    // Generate admission number
    const admissionNumber = await this.generateAdmissionNumber();

    // Create IPD admission using MedicalRecord model
    const treatmentPlanData = {
      recordType: 'IPD_ADMISSION',
      admissionNumber,
      admissionType: admissionData.admissionType,
      priority: admissionData.priority,
      expectedStayDays: admissionData.expectedStayDays,
      department: admissionData.admittingDepartment,
      wardType: admissionData.wardType,
      insuranceInfo: admissionData.insuranceInfo,
      admittingNotes: admissionData.admittingNotes,
      admittedBy: admissionData.admittedBy,
      status: 'ADMITTED',
      admissionDate: new Date().toISOString(),
      bedAssignment: {
        bedId: availableBed.id,
        bedNumber: availableBed.bedNumber,
        roomNumber: availableBed.roomNumber,
        wardType: availableBed.wardType,
        assignedAt: new Date().toISOString(),
      },
      progressNotes: [],
      nursingNotes: [],
      vitalSigns: [],
      transferHistory: [],
    };

    const admission = await this.prisma.medicalRecord.create({
      data: {
        patientId: admissionData.patientId,
        tenantId: admissionData.tenantId,
        doctorId: admissionData.admittingDoctorId,
        visitDate: new Date(),
        chiefComplaint: admissionData.primaryDiagnosis,
        diagnosis: ['ADMITTED', admissionData.primaryDiagnosis], // Using diagnosis array for status
        treatmentPlan: JSON.stringify(treatmentPlanData),
        notes: `IPD_ADMISSION - ${admissionData.admissionType}`,
        followUpDate: admissionData.expectedStayDays
          ? new Date(Date.now() + admissionData.expectedStayDays * 24 * 60 * 60 * 1000)
          : undefined,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update bed status in mock data
    const bedIndex = this.mockBeds.findIndex(b => b.id === availableBed.id);
    if (bedIndex !== -1) {
      this.mockBeds[bedIndex] = { ...this.mockBeds[bedIndex], status: 'OCCUPIED' };
    }

    // Log admission
    await this.complianceService.logAuditEvent({
      userId: admissionData.admittedBy,
      action: 'PATIENT_ADMITTED_IPD',
      resource: 'medical_records',
      resourceId: admission.id,
      details: {
        admissionNumber,
        patientId: admissionData.patientId,
        wardType: admissionData.wardType,
        primaryDiagnosis: admissionData.primaryDiagnosis,
        bedId: availableBed.id,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return this.transformMedicalRecordToIPDAdmission(admission);
  }

  /**
   * Transfer patient between wards/beds
   */
  async transferPatient(
    admissionId: string,
    transferData: TransferPatientDto & { transferredBy: string },
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: admissionId },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    if (treatmentPlan.status !== 'ADMITTED') {
      throw new BadRequestException('Patient is not currently admitted');
    }

    let newBedId = transferData.newBedId;
    let newBed = null;

    // Find new bed if ward type is changing
    if (transferData.newWardType && transferData.newWardType !== treatmentPlan.wardType) {
      newBed = await this.findAvailableBed(transferData.newWardType);
      if (!newBed) {
        throw new BadRequestException(`No beds available in ${transferData.newWardType} ward`);
      }
      newBedId = newBed.id;
    }

    // Get current bed assignment
    const currentBedId = treatmentPlan.bedAssignment?.bedId;

    // Update admission
    const transferHistory = treatmentPlan.transferHistory || [];
    transferHistory.push({
      fromBed: currentBedId,
      toBed: newBedId,
      reason: transferData.transferReason,
      transferredAt: new Date().toISOString(),
      transferredBy: transferData.transferredBy,
    });

    let updatedBedAssignment = treatmentPlan.bedAssignment;
    if (newBedId && newBedId !== currentBedId) {
      updatedBedAssignment = {
        bedId: newBedId,
        bedNumber: newBed?.bedNumber || treatmentPlan.bedAssignment.bedNumber,
        roomNumber: newBed?.roomNumber || treatmentPlan.bedAssignment.roomNumber,
        wardType: transferData.newWardType || treatmentPlan.wardType,
        assignedAt: new Date().toISOString(),
      };
    }

    treatmentPlan.wardType = transferData.newWardType || treatmentPlan.wardType;
    treatmentPlan.bedAssignment = updatedBedAssignment;
    treatmentPlan.transferHistory = transferHistory;

    await this.prisma.medicalRecord.update({
      where: { id: admissionId },
      data: {
        treatmentPlan: JSON.stringify(treatmentPlan),
        updatedAt: new Date(),
      },
    });

    // Update bed statuses in mock data
    if (newBedId && newBedId !== currentBedId) {
      // Free old bed
      const oldBedIndex = this.mockBeds.findIndex(b => b.id === currentBedId);
      if (oldBedIndex !== -1) {
        this.mockBeds[oldBedIndex] = { ...this.mockBeds[oldBedIndex], status: 'AVAILABLE' };
      }

      // Occupy new bed
      const newBedIndex = this.mockBeds.findIndex(b => b.id === newBedId);
      if (newBedIndex !== -1) {
        this.mockBeds[newBedIndex] = { ...this.mockBeds[newBedIndex], status: 'OCCUPIED' };
      }
    }

    // Log transfer
    await this.complianceService.logAuditEvent({
      userId: transferData.transferredBy,
      action: 'PATIENT_TRANSFERRED_IPD',
      resource: 'medical_records',
      resourceId: admissionId,
      details: {
        fromBed: currentBedId,
        toBed: newBedId,
        transferReason: transferData.transferReason,
        newWardType: transferData.newWardType,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return this.getIPDAdmissionById(admissionId);
  }

  /**
   * Record vital signs
   */
  async recordVitals(admissionId: string, vitalsData: VitalSignsDto & { recordedBy: string }) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: admissionId },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    const vitalSigns = treatmentPlan.vitalSigns || [];

    const newVitals = {
      id: `vitals-${Date.now()}`,
      ...vitalsData,
      recordedAt: new Date().toISOString(),
    };

    vitalSigns.push(newVitals);
    treatmentPlan.vitalSigns = vitalSigns;
    treatmentPlan.lastVitals = new Date().toISOString();

    await this.prisma.medicalRecord.update({
      where: { id: admissionId },
      data: {
        treatmentPlan: JSON.stringify(treatmentPlan),
        updatedAt: new Date(),
      },
    });

    // Check for abnormal values and create alerts
    await this.checkVitalSignsAlerts(newVitals);

    return newVitals;
  }

  /**
   * Discharge patient with comprehensive summary
   */
  async dischargePatient(
    admissionId: string,
    dischargeData: DischargePatientDto & { dischargedBy: string },
  ) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: admissionId },
      include: { patient: true, doctor: true },
    });

    if (!record || !this.isIPDAdmission(record)) {
      throw new NotFoundException('IPD admission not found');
    }

    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    if (treatmentPlan.status === 'DISCHARGED') {
      throw new BadRequestException('Patient is already discharged');
    }

    // Calculate length of stay
    const admissionDate = new Date(treatmentPlan.admissionDate);
    const dischargeDate = new Date();
    const lengthOfStay = Math.ceil(
      (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Update admission with discharge information
    treatmentPlan.status = 'DISCHARGED';
    treatmentPlan.dischargeDate = dischargeDate.toISOString();
    treatmentPlan.lengthOfStay = lengthOfStay;
    treatmentPlan.dischargeType = dischargeData.dischargeType;
    treatmentPlan.dischargeSummary = dischargeData.dischargeSummary;
    treatmentPlan.dischargeNotes = dischargeData.dischargeNotes;
    treatmentPlan.dischargedBy = dischargeData.dischargedBy;

    await this.prisma.medicalRecord.update({
      where: { id: admissionId },
      data: {
        diagnosis: record.diagnosis.filter(d => d !== 'ADMITTED').concat(['DISCHARGED']),
        treatmentPlan: JSON.stringify(treatmentPlan),
        updatedAt: new Date(),
      },
    });

    // Free up the bed
    const bedId = treatmentPlan.bedAssignment?.bedId;
    if (bedId) {
      const bedIndex = this.mockBeds.findIndex(b => b.id === bedId);
      if (bedIndex !== -1) {
        this.mockBeds[bedIndex] = { ...this.mockBeds[bedIndex], status: 'AVAILABLE' };
      }
    }

    // Create discharge prescriptions
    if (dischargeData.dischargeSummary.medicationsOnDischarge.length > 0) {
      for (const med of dischargeData.dischargeSummary.medicationsOnDischarge) {
        await this.prisma.prescription.create({
          data: {
            patientId: record.patientId,
            tenantId: record.tenantId,
            doctorId: record.doctorId,
            medicationId: med.medicationId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            quantity: Math.max(1, med.duration), // Calculate quantity based on duration
            prescribedDate: new Date(),
            status: PrescriptionStatus.ACTIVE,
          },
        });
      }
    }

    // Log discharge
    await this.complianceService.logAuditEvent({
      userId: dischargeData.dischargedBy,
      action: 'PATIENT_DISCHARGED_IPD',
      resource: 'medical_records',
      resourceId: admissionId,
      details: {
        dischargeType: dischargeData.dischargeType,
        lengthOfStay,
        outcome: dischargeData.dischargeSummary.outcome,
        medicationsCount: dischargeData.dischargeSummary.medicationsOnDischarge.length,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return this.getIPDAdmissionById(admissionId);
  }

  /**
   * Get bed availability by ward type
   */
  async getBedAvailability() {
    // Update bed status based on current admissions
    await this.getBedOccupancy();

    return this.mockBeds.reduce(
      (acc, bed) => {
        const wardType = bed.wardType;
        if (!acc[wardType]) {
          acc[wardType] = { total: 0, available: 0, occupied: 0 };
        }

        acc[wardType].total++;
        if (bed.status === 'AVAILABLE') {
          acc[wardType].available++;
        } else {
          acc[wardType].occupied++;
        }

        return acc;
      },
      {} as Record<string, { total: number; available: number; occupied: number }>,
    );
  }

  /**
   * Get IPD performance metrics
   */
  async getIPDPerformanceMetrics(startDate: Date, endDate: Date) {
    const admissions = await this.prisma.medicalRecord.findMany({
      where: {
        notes: {
          contains: 'IPD_ADMISSION',
        },
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalAdmissions = admissions.length;
    const discharged = admissions.filter(a => {
      const treatmentPlan = a.treatmentPlan as any;
      return treatmentPlan.status === 'DISCHARGED';
    }).length;

    const admittedWithStay = admissions.filter(a => {
      const treatmentPlan = a.treatmentPlan as any;
      return treatmentPlan.lengthOfStay !== undefined;
    });

    const avgLengthOfStay =
      admittedWithStay.length > 0
        ? admittedWithStay.reduce((sum, a) => {
            const treatmentPlan = a.treatmentPlan as any;
            return sum + (treatmentPlan.lengthOfStay || 0);
          }, 0) / admittedWithStay.length
        : 0;

    const bedOccupancyRate = await this.calculateBedOccupancyRate(startDate, endDate);

    return {
      period: { startDate, endDate },
      totalAdmissions,
      discharged,
      currentlyAdmitted: totalAdmissions - discharged,
      avgLengthOfStay: Math.round(avgLengthOfStay * 100) / 100,
      bedOccupancyRate: Math.round(bedOccupancyRate * 100) / 100,
      dischargeOutcomes: this.calculateDischargeOutcomes(admissions),
    };
  }

  // Helper methods

  /**
   *
   */
  private isIPDAdmission(record: any): boolean {
    const treatmentPlan = record.treatmentPlan;
    return treatmentPlan?.recordType === 'IPD_ADMISSION';
  }

  /**
   *
   */
  private transformMedicalRecordToIPDAdmission(record: any) {
    const treatmentPlan = record.treatmentPlan ? JSON.parse(record.treatmentPlan) : {};
    const patient = record.patient;
    const doctor = record.doctor;

    return {
      id: record.id,
      admissionNumber: treatmentPlan.admissionNumber || `IPD-${record.id}`,
      patient: {
        id: patient.id,
        firstName: patient.user.firstName,
        lastName: patient.user.lastName,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
      },
      doctor: {
        id: doctor.id,
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        specialization: doctor.specialization,
      },
      bedAssignment: treatmentPlan.bedAssignment || null,
      primaryDiagnosis: record.chiefComplaint,
      admissionType: treatmentPlan.admissionType,
      priority: treatmentPlan.priority,
      wardType: treatmentPlan.wardType,
      department: treatmentPlan.department,
      admissionDate: new Date(record.visitDate),
      dischargeDate: treatmentPlan.dischargeDate
        ? new Date(treatmentPlan.dischargeDate)
        : undefined,
      lengthOfStay: treatmentPlan.lengthOfStay,
      status: treatmentPlan.status,
      insuranceInfo: treatmentPlan.insuranceInfo,
      admittingNotes: treatmentPlan.admittingNotes,
      treatmentPlan: treatmentPlan, // Include parsed treatment plan
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   *
   */
  private async findAvailableBed(wardType: WardType): Promise<BedInfoDto | null> {
    const availableBed = this.mockBeds.find(
      bed => bed.wardType === wardType && bed.status === 'AVAILABLE',
    );
    return availableBed || null;
  }

  /**
   *
   */
  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.medicalRecord.count({
      where: {
        treatmentPlan: {
          contains: '"recordType":"IPD_ADMISSION"',
        },
        visitDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `IPD${year}${(count + 1).toString().padStart(6, '0')}`;
  }

  /**
   *
   */
  private async checkVitalSignsAlerts(vitals: any) {
    const alerts = [];

    // Check for critical values
    if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 150)) {
      alerts.push('Abnormal heart rate');
    }

    if (vitals.temperature && (vitals.temperature < 35 || vitals.temperature > 40)) {
      alerts.push('Abnormal temperature');
    }

    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
      alerts.push('Low oxygen saturation');
    }

    // Create alerts if any critical values found
    if (alerts.length > 0) {
      await this.complianceService.logAuditEvent({
        userId: vitals.recordedBy,
        action: 'VITAL_SIGNS_ALERT',
        resource: 'medical_records',
        resourceId: vitals.id,
        details: {
          alerts,
          vitals: {
            heartRate: vitals.heartRate,
            temperature: vitals.temperature,
            oxygenSaturation: vitals.oxygenSaturation,
          },
        },
        complianceFlags: ['CRITICAL_PATIENT_DATA'],
      });
    }
  }

  /**
   *
   */
  private async calculateBedOccupancyRate(startDate: Date, endDate: Date): Promise<number> {
    // Simplified calculation based on current mock beds
    const totalBeds = this.mockBeds.length;
    const occupiedBeds = this.mockBeds.filter(bed => bed.status === 'OCCUPIED').length;

    return totalBeds > 0 ? occupiedBeds / totalBeds : 0;
  }

  /**
   *
   */
  private calculateDischargeOutcomes(admissions: any[]) {
    const outcomes = {
      CURED: 0,
      IMPROVED: 0,
      UNCHANGED: 0,
      WORSENED: 0,
    };

    admissions
      .filter(a => {
        const treatmentPlan = a.treatmentPlan;
        return treatmentPlan.status === 'DISCHARGED' && treatmentPlan.dischargeSummary?.outcome;
      })
      .forEach(a => {
        const treatmentPlan = a.treatmentPlan;
        outcomes[treatmentPlan.dischargeSummary.outcome]++;
      });

    return outcomes;
  }

  // ICU/CCU Management Methods

  /**
   * Transfer patient to ICU with critical care assessment
   */
  async transferToICU(admissionId: string, data: ICUTransferDto & { transferredBy: string }) {
    const admission = await this.getIPDAdmissionById(admissionId);
    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    // Update admission with ICU transfer details
    const updatedAdmission = {
      ...admission,
      wardType: WardType.ICU,
      priority: AdmissionPriority.CRITICAL,
      treatmentPlan: {
        ...admission.treatmentPlan,
        icuTransfer: {
          ...data,
          transferDate: new Date(),
          transferredBy: data.transferredBy,
        },
      },
    };

    // Log compliance event for ICU transfer
    await this.complianceService.logComplianceEvent({
      userId: data.transferredBy,
      action: 'ICU_TRANSFER',
      resource: 'ipd_admission',
      resourceId: admissionId,
      eventType: 'ICU_TRANSFER',
      details: {
        patientId: admission.patient.id,
        admissionId,
        reason: data.admissionReason,
        apacheIIScore: data.apacheIIScore,
        sofaScore: data.sofaScore,
      },
      complianceFlags: ['CRITICAL_PATIENT_TRANSFER', 'ICU_ADMISSION'],
    });

    return updatedAdmission;
  }

  /**
   * Record ICU progress note with comprehensive assessment
   */
  async recordICUProgress(admissionId: string, data: ICUProgressNoteDto & { recordedBy: string }) {
    const admission = await this.getIPDAdmissionById(admissionId);
    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    const progressNote = {
      id: `icu-progress-${Date.now()}`,
      admissionId,
      ...data,
      recordedAt: new Date(),
      recordedBy: data.recordedBy,
    };

    // In a real implementation, this would be saved to database
    // For now, we'll add it to the admission's treatment plan
    const updatedAdmission = {
      ...admission,
      treatmentPlan: {
        ...admission.treatmentPlan,
        icuProgressNotes: [...(admission.treatmentPlan.icuProgressNotes || []), progressNote],
      },
    };

    return progressNote;
  }

  /**
   * Assess ICU discharge readiness
   */
  async assessICUDischargeReadiness(
    admissionId: string,
    data: ICUDischargeReadinessDto & { assessedBy: string },
  ) {
    const admission = await this.getIPDAdmissionById(admissionId);
    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    const assessment = {
      id: `icu-readiness-${Date.now()}`,
      admissionId,
      ...data,
      assessedAt: new Date(),
      assessedBy: data.assessedBy,
    };

    // Update admission with discharge readiness assessment
    const updatedAdmission = {
      ...admission,
      treatmentPlan: {
        ...admission.treatmentPlan,
        icuDischargeReadiness: assessment,
      },
    };

    // Log compliance event
    await this.complianceService.logComplianceEvent({
      userId: data.assessedBy,
      action: 'ICU_DISCHARGE_ASSESSMENT',
      resource: 'ipd_admission',
      resourceId: admissionId,
      eventType: 'ICU_DISCHARGE_ASSESSMENT',
      details: {
        patientId: admission.patient.id,
        admissionId,
        readyForDischarge: data.readyForDischarge,
        destination: data.dischargeDestination,
      },
      complianceFlags: ['CRITICAL_PATIENT_DISCHARGE'],
    });

    return assessment;
  }

  /**
   * Get all ICU patients
   */
  async getICUPatients() {
    const allAdmissions = await this.getIPDAdmissions();
    return allAdmissions.filter(
      admission => admission.wardType === WardType.ICU || admission.wardType === WardType.CCU,
    );
  }

  /**
   * Get ICU bed occupancy
   */
  async getICUBedOccupancy() {
    const icuBeds = this.mockBeds.filter(
      bed => bed.wardType === WardType.ICU || bed.wardType === WardType.CCU,
    );

    return {
      totalBeds: icuBeds.length,
      occupiedBeds: icuBeds.filter(bed => bed.status === 'OCCUPIED').length,
      availableBeds: icuBeds.filter(bed => bed.status === 'AVAILABLE').length,
      maintenanceBeds: icuBeds.filter(bed => bed.status === 'MAINTENANCE').length,
      occupancyRate:
        icuBeds.length > 0
          ? icuBeds.filter(bed => bed.status === 'OCCUPIED').length / icuBeds.length
          : 0,
      beds: icuBeds,
    };
  }

  /**
   * Get ICU performance metrics
   */
  async getICUPerformanceMetrics(startDate: Date, endDate: Date) {
    const icuAdmissions = await this.getICUPatients();

    return {
      totalICUPatients: icuAdmissions.length,
      averageLengthOfStay: this.calculateAverageLOS(icuAdmissions),
      mortalityRate: this.calculateICUMortalityRate(icuAdmissions),
      ventilatorUsage: this.calculateVentilatorUsage(icuAdmissions),
      bedOccupancyRate: await this.calculateICUBedOccupancyRate(startDate, endDate),
      apacheIIScoreDistribution: this.calculateAPACHEDistribution(icuAdmissions),
      sofaScoreDistribution: this.calculateSOFADistribution(icuAdmissions),
      dischargeOutcomes: this.calculateICUDischargeOutcomes(icuAdmissions),
    };
  }

  /**
   * Calculate average length of stay for ICU patients
   */
  private calculateAverageLOS(admissions: any[]): number {
    const completedAdmissions = admissions.filter(a => a.dischargeDate);
    if (completedAdmissions.length === 0) return 0;

    const totalLOS = completedAdmissions.reduce((sum, admission) => {
      const los = Math.ceil(
        (new Date(admission.dischargeDate).getTime() -
          new Date(admission.admissionDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + los;
    }, 0);

    return totalLOS / completedAdmissions.length;
  }

  /**
   * Calculate ICU mortality rate
   */
  private calculateICUMortalityRate(admissions: any[]): number {
    const dischargedPatients = admissions.filter(a => a.status === 'DISCHARGED');
    if (dischargedPatients.length === 0) return 0;

    const deaths = dischargedPatients.filter(
      a =>
        a.treatmentPlan.dischargeSummary?.outcome === 'WORSENED' ||
        a.dischargeType === DischargeType.EXPIRED,
    ).length;

    return deaths / dischargedPatients.length;
  }

  /**
   * Calculate ventilator usage percentage
   */
  private calculateVentilatorUsage(admissions: any[]): number {
    const icuAssessments = admissions.flatMap(a => a.treatmentPlan.icuProgressNotes || []);

    if (icuAssessments.length === 0) return 0;

    const ventilatorCases = icuAssessments.filter(note => note.assessment?.onVentilator).length;

    return ventilatorCases / icuAssessments.length;
  }

  /**
   * Calculate ICU bed occupancy rate over time period
   */
  private async calculateICUBedOccupancyRate(startDate: Date, endDate: Date): Promise<number> {
    // Simplified calculation - in real implementation would analyze historical data
    const icuBeds = this.mockBeds.filter(
      bed => bed.wardType === WardType.ICU || bed.wardType === WardType.CCU,
    );

    const occupiedBeds = icuBeds.filter(bed => bed.status === 'OCCUPIED').length;
    return icuBeds.length > 0 ? occupiedBeds / icuBeds.length : 0;
  }

  /**
   * Calculate APACHE II score distribution
   */
  private calculateAPACHEDistribution(admissions: any[]) {
    const scores = admissions
      .map(a => a.treatmentPlan.icuTransfer?.apacheIIScore)
      .filter(score => score !== undefined);

    return {
      low: scores.filter(s => s < 15).length,
      moderate: scores.filter(s => s >= 15 && s < 25).length,
      high: scores.filter(s => s >= 25 && s < 35).length,
      veryHigh: scores.filter(s => s >= 35).length,
      average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
  }

  /**
   * Calculate SOFA score distribution
   */
  private calculateSOFADistribution(admissions: any[]) {
    const scores = admissions
      .map(a => a.treatmentPlan.icuTransfer?.sofaScore)
      .filter(score => score !== undefined);

    return {
      low: scores.filter(s => s < 6).length,
      moderate: scores.filter(s => s >= 6 && s < 12).length,
      high: scores.filter(s => s >= 12).length,
      average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
  }

  /**
   * Calculate ICU discharge outcomes
   */
  private calculateICUDischargeOutcomes(admissions: any[]) {
    const outcomes = {
      IMPROVED: 0,
      TRANSFERRED_TO_WARD: 0,
      EXPIRED: 0,
      STILL_IN_ICU: 0,
    };

    admissions.forEach(admission => {
      if (admission.status === 'ADMITTED') {
        outcomes.STILL_IN_ICU++;
      } else if (admission.dischargeType === DischargeType.EXPIRED) {
        outcomes.EXPIRED++;
      } else if (admission.dischargeType === DischargeType.TRANSFER) {
        outcomes.TRANSFERRED_TO_WARD++;
      } else {
        outcomes.IMPROVED++;
      }
    });

    return outcomes;
  }
}
