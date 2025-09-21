import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class IPDService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  async admitPatient(data: any) {
    return this.prisma.iPDAdmission.create({ data });
  }

  async getIPDAdmissions() {
    return this.prisma.iPDAdmission.findMany({
      include: { patient: true, doctor: true, room: true, bed: true },
    });
  }

  async getIPDAdmissionById(id: string) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        room: true,
        bed: true,
        progressNotes: true,
        nursingNotes: true,
        vitals: true,
      },
    });
    if (!admission) throw new NotFoundException('IPD admission not found');
    return admission;
  }

  async updateAdmission(id: string, data: any) {
    return this.prisma.iPDAdmission.update({
      where: { id },
      data,
    });
  }

  async dischargePatient(id: string, dischargeData: any) {
    return this.prisma.iPDAdmission.update({
      where: { id },
      data: {
        status: 'DISCHARGED',
        dischargeSummary: dischargeData.summary,
        dischargeDate: new Date(),
      },
    });
  }

  async getBedOccupancy() {
    return this.prisma.bed.findMany({
      include: { room: true, currentAdmission: { include: { patient: true } } },
    });
  }

  async assignBed(admissionId: string, bedId: string) {
    return this.prisma.iPDAdmission.update({
      where: { id: admissionId },
      data: { bedId },
    });
  }

  async addProgressNote(admissionId: string, note: any) {
    return this.prisma.progressNote.create({
      data: {
        admissionId,
        ...note,
      },
    });
  }

  async addNursingNote(admissionId: string, note: any) {
    return this.prisma.nursingNote.create({
      data: {
        admissionId,
        ...note,
      },
    });
  }

  /**
   * Admit patient to IPD with comprehensive validation
   */
  async admitPatientToIPD(admissionData: {
    patientId: string;
    admittingDoctorId: string;
    primaryDiagnosis: string;
    admissionType: 'EMERGENCY' | 'ELECTIVE' | 'TRANSFER';
    priority: 'ROUTINE' | 'URGENT' | 'CRITICAL';
    expectedStayDays?: number;
    admittingDepartment: string;
    wardType: 'GENERAL' | 'PRIVATE' | 'ICU' | 'CCU' | 'NICU' | 'PICU';
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED';
      preAuthNumber?: string;
    };
    admittingNotes?: string;
    admittedBy: string;
  }) {
    // Validate patient exists and is not already admitted
    const patient = await this.prisma.patient.findUnique({
      where: { id: admissionData.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const existingAdmission = await this.prisma.iPDAdmission.findFirst({
      where: {
        patientId: admissionData.patientId,
        status: { in: ['ADMITTED', 'TRANSFERRED'] },
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

    // Create IPD admission
    const admission = await this.prisma.iPDAdmission.create({
      data: {
        patientId: admissionData.patientId,
        doctorId: admissionData.admittingDoctorId,
        bedId: availableBed.id,
        admissionNumber,
        primaryDiagnosis: admissionData.primaryDiagnosis,
        admissionType: admissionData.admissionType,
        priority: admissionData.priority,
        expectedStayDays: admissionData.expectedStayDays,
        department: admissionData.admittingDepartment,
        wardType: admissionData.wardType,
        insuranceInfo: admissionData.insuranceInfo,
        admittingNotes: admissionData.admittingNotes,
        admissionDate: new Date(),
        status: 'ADMITTED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true },
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
        bed: {
          include: {
            room: true,
          },
        },
      },
    });

    // Update bed status
    await this.prisma.bed.update({
      where: { id: availableBed.id },
      data: { status: 'OCCUPIED' },
    });

    // Log admission
    await this.complianceService.logAuditEvent({
      userId: admissionData.admittedBy,
      action: 'PATIENT_ADMITTED_IPD',
      resource: 'ipd_admissions',
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

    return admission;
  }

  /**
   * Transfer patient between wards/beds
   */
  async transferPatient(
    admissionId: string,
    transferData: {
      newBedId?: string;
      newWardType?: string;
      transferReason: string;
      transferredBy: string;
    },
  ) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id: admissionId },
      include: { bed: true },
    });

    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    if (admission.status !== 'ADMITTED') {
      throw new BadRequestException('Patient is not currently admitted');
    }

    let newBedId = transferData.newBedId;

    // Find new bed if ward type is changing
    if (transferData.newWardType && transferData.newWardType !== admission.wardType) {
      const availableBed = await this.findAvailableBed(transferData.newWardType);
      if (!availableBed) {
        throw new BadRequestException(`No beds available in ${transferData.newWardType} ward`);
      }
      newBedId = availableBed.id;
    }

    // Update admission
    const updatedAdmission = await this.prisma.iPDAdmission.update({
      where: { id: admissionId },
      data: {
        bedId: newBedId || admission.bedId,
        wardType: transferData.newWardType || admission.wardType,
        transferHistory: {
          push: {
            fromBed: admission.bedId,
            toBed: newBedId,
            reason: transferData.transferReason,
            transferredAt: new Date(),
            transferredBy: transferData.transferredBy,
          },
        },
      },
    });

    // Update bed statuses
    if (newBedId && newBedId !== admission.bedId) {
      // Free old bed
      await this.prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // Occupy new bed
      await this.prisma.bed.update({
        where: { id: newBedId },
        data: { status: 'OCCUPIED' },
      });
    }

    // Log transfer
    await this.complianceService.logAuditEvent({
      userId: transferData.transferredBy,
      action: 'PATIENT_TRANSFERRED_IPD',
      resource: 'ipd_admissions',
      resourceId: admissionId,
      details: {
        fromBed: admission.bedId,
        toBed: newBedId,
        transferReason: transferData.transferReason,
        newWardType: transferData.newWardType,
      },
      complianceFlags: ['HIPAA', 'PATIENT_ACCESS'],
    });

    return updatedAdmission;
  }

  /**
   * Add comprehensive progress note
   */
  async addProgressNote(
    admissionId: string,
    noteData: {
      notedBy: string;
      noteType: 'DAILY' | 'SPECIALIST_CONSULTATION' | 'PROCEDURE' | 'COMPLICATION' | 'IMPROVEMENT';
      subjective: string; // Patient's symptoms/complaints
      objective: string; // Physical examination findings
      assessment: string; // Doctor's assessment
      plan: string; // Treatment plan
      orders?: string[]; // New orders/medications
      followUpDate?: Date;
      private?: boolean; // For sensitive notes
    },
  ) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    const progressNote = await this.prisma.progressNote.create({
      data: {
        admissionId,
        notedBy: noteData.notedBy,
        noteType: noteData.noteType,
        subjective: noteData.subjective,
        objective: noteData.objective,
        assessment: noteData.assessment,
        plan: noteData.plan,
        orders: noteData.orders,
        followUpDate: noteData.followUpDate,
        private: noteData.private || false,
        notedAt: new Date(),
      },
    });

    // Update admission last progress note
    await this.prisma.iPDAdmission.update({
      where: { id: admissionId },
      data: {
        lastProgressNote: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log progress note
    await this.complianceService.logAuditEvent({
      userId: noteData.notedBy,
      action: 'PROGRESS_NOTE_ADDED',
      resource: 'progress_notes',
      resourceId: progressNote.id,
      details: {
        admissionId,
        noteType: noteData.noteType,
        private: noteData.private,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return progressNote;
  }

  /**
   * Record vital signs
   */
  async recordVitals(
    admissionId: string,
    vitalsData: {
      recordedBy: string;
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      painScore?: number; // 0-10 scale
      consciousness?: 'ALERT' | 'CONFUSED' | 'STUPOROUS' | 'COMATOSE';
      notes?: string;
    },
  ) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    const vitals = await this.prisma.vitalSign.create({
      data: {
        admissionId,
        recordedBy: vitalsData.recordedBy,
        bloodPressure: vitalsData.bloodPressure,
        heartRate: vitalsData.heartRate,
        temperature: vitalsData.temperature,
        respiratoryRate: vitalsData.respiratoryRate,
        oxygenSaturation: vitalsData.oxygenSaturation,
        weight: vitalsData.weight,
        height: vitalsData.height,
        painScore: vitalsData.painScore,
        consciousness: vitalsData.consciousness,
        notes: vitalsData.notes,
        recordedAt: new Date(),
      },
    });

    // Check for abnormal values and create alerts
    await this.checkVitalSignsAlerts(vitals);

    return vitals;
  }

  /**
   * Add nursing note with care activities
   */
  async addNursingNote(
    admissionId: string,
    noteData: {
      notedBy: string;
      shift: 'MORNING' | 'EVENING' | 'NIGHT';
      activities: string[]; // Care activities performed
      observations: string; // Patient observations
      interventions: string[]; // Nursing interventions
      patientResponse: string; // How patient responded
      handoffNotes?: string; // Notes for next shift
    },
  ) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    const nursingNote = await this.prisma.nursingNote.create({
      data: {
        admissionId,
        notedBy: noteData.notedBy,
        shift: noteData.shift,
        activities: noteData.activities,
        observations: noteData.observations,
        interventions: noteData.interventions,
        patientResponse: noteData.patientResponse,
        handoffNotes: noteData.handoffNotes,
        notedAt: new Date(),
      },
    });

    // Log nursing note
    await this.complianceService.logAuditEvent({
      userId: noteData.notedBy,
      action: 'NURSING_NOTE_ADDED',
      resource: 'nursing_notes',
      resourceId: nursingNote.id,
      details: {
        admissionId,
        shift: noteData.shift,
        activitiesCount: noteData.activities.length,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return nursingNote;
  }

  /**
   * Discharge patient with comprehensive summary
   */
  async dischargePatient(
    admissionId: string,
    dischargeData: {
      dischargedBy: string;
      dischargeType: 'REGULAR' | 'AGAINST_MEDICAL_ADVICE' | 'TRANSFER' | 'EXPIRED';
      dischargeSummary: {
        finalDiagnosis: string[];
        treatmentGiven: string;
        complications?: string[];
        outcome: 'CURED' | 'IMPROVED' | 'UNCHANGED' | 'WORSENED';
        followUpInstructions: string;
        medicationsOnDischarge: Array<{
          medicationId: string;
          dosage: string;
          frequency: string;
          duration: number;
        }>;
        followUpDate?: Date;
      };
      dischargeNotes?: string;
    },
  ) {
    const admission = await this.prisma.iPDAdmission.findUnique({
      where: { id: admissionId },
      include: { bed: true, patient: true },
    });

    if (!admission) {
      throw new NotFoundException('IPD admission not found');
    }

    if (admission.status === 'DISCHARGED') {
      throw new BadRequestException('Patient is already discharged');
    }

    // Calculate length of stay
    const admissionDate = admission.admissionDate;
    const dischargeDate = new Date();
    const lengthOfStay = Math.ceil(
      (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Update admission with discharge information
    const updatedAdmission = await this.prisma.iPDAdmission.update({
      where: { id: admissionId },
      data: {
        status: 'DISCHARGED',
        dischargeDate,
        lengthOfStay,
        dischargeType: dischargeData.dischargeType,
        dischargeSummary: dischargeData.dischargeSummary,
        dischargeNotes: dischargeData.dischargeNotes,
        dischargedBy: dischargeData.dischargedBy,
      },
    });

    // Free up the bed
    await this.prisma.bed.update({
      where: { id: admission.bedId },
      data: { status: 'AVAILABLE' },
    });

    // Create discharge prescriptions
    if (dischargeData.dischargeSummary.medicationsOnDischarge.length > 0) {
      for (const med of dischargeData.dischargeSummary.medicationsOnDischarge) {
        await this.prisma.prescription.create({
          data: {
            patientId: admission.patientId,
            doctorId: admission.doctorId,
            medicationId: med.medicationId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            prescribedDate: new Date(),
            status: 'ACTIVE',
          },
        });
      }
    }

    // Log discharge
    await this.complianceService.logAuditEvent({
      userId: dischargeData.dischargedBy,
      action: 'PATIENT_DISCHARGED_IPD',
      resource: 'ipd_admissions',
      resourceId: admissionId,
      details: {
        dischargeType: dischargeData.dischargeType,
        lengthOfStay,
        outcome: dischargeData.dischargeSummary.outcome,
        medicationsCount: dischargeData.dischargeSummary.medicationsOnDischarge.length,
      },
      complianceFlags: ['HIPAA', 'PATIENT_DATA'],
    });

    return updatedAdmission;
  }

  /**
   * Get bed availability by ward type
   */
  async getBedAvailability() {
    const beds = await this.prisma.bed.findMany({
      include: {
        room: {
          include: {
            ward: true,
          },
        },
        currentAdmission: {
          include: {
            patient: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    const availability = beds.reduce((acc, bed) => {
      const wardType = bed.room.ward.type;
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
    }, {});

    return availability;
  }

  /**
   * Get IPD performance metrics
   */
  async getIPDPerformanceMetrics(startDate: Date, endDate: Date) {
    const admissions = await this.prisma.iPDAdmission.findMany({
      where: {
        admissionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        progressNotes: true,
        nursingNotes: true,
        vitalSigns: true,
      },
    });

    const totalAdmissions = admissions.length;
    const discharged = admissions.filter(a => a.status === 'DISCHARGED').length;
    const avgLengthOfStay =
      admissions.filter(a => a.lengthOfStay).reduce((sum, a) => sum + a.lengthOfStay, 0) /
        discharged || 0;

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

  private async findAvailableBed(wardType: string) {
    return await this.prisma.bed.findFirst({
      where: {
        status: 'AVAILABLE',
        room: {
          ward: {
            type: wardType,
          },
        },
      },
      include: {
        room: true,
      },
    });
  }

  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.iPDAdmission.count({
      where: {
        admissionDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `IPD${year}${(count + 1).toString().padStart(6, '0')}`;
  }

  private async checkVitalSignsAlerts(vitals: any) {
    const alerts = [];

    // Check for critical values
    if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 150)) {
      alerts.push('Abnormal heart rate');
    }

    if (vitals.temperature && (vitals.temperature < 95 || vitals.temperature > 104)) {
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
        resource: 'vital_signs',
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

  private async calculateBedOccupancyRate(startDate: Date, endDate: Date): Promise<number> {
    // Simplified calculation - in real implementation, would track daily occupancy
    const totalBeds = await this.prisma.bed.count();
    const occupiedBeds = await this.prisma.bed.count({
      where: { status: 'OCCUPIED' },
    });

    return totalBeds > 0 ? occupiedBeds / totalBeds : 0;
  }

  private calculateDischargeOutcomes(admissions: any[]) {
    const outcomes = {
      CURED: 0,
      IMPROVED: 0,
      UNCHANGED: 0,
      WORSENED: 0,
    };

    admissions
      .filter(a => a.status === 'DISCHARGED' && a.dischargeSummary?.outcome)
      .forEach(a => {
        outcomes[a.dischargeSummary.outcome]++;
      });

    return outcomes;
  }
}
