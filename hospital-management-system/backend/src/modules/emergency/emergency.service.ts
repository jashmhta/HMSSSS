/*[object Object]*/
import { Injectable, NotFoundException } from '@nestjs/common';
import { TriageLevel } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class EmergencyService {
  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   *
   */
  async registerEmergencyPatient(data: any) {
    // Create emergency visit with default triage level
    const emergencyVisit = await this.prisma.emergencyVisit.create({
      data: {
        patientId: data.patientId,
        visitNumber: data.visitNumber || `EMG-${Date.now()}`,
        triageLevel: data.triageLevel || TriageLevel.LEVEL_3,
        chiefComplaint: data.chiefComplaint,
        vitalSigns: data.vitalSigns,
        assessment: data.assessment,
        treatment: data.treatment,
        disposition: data.disposition || 'DISCHARGED',
        notes: data.notes,
      },
    });

    // Trigger critical alerts if triage level is 1 (Resuscitation)
    if (data.triageLevel === TriageLevel.LEVEL_1) {
      await this.triggerCriticalAlert(emergencyVisit.id);
    }

    return emergencyVisit;
  }

  /**
   *
   */
  async getEmergencyVisits() {
    return this.prisma.emergencyVisit.findMany({
      include: {
        patient: true,
        vitals: true,
        medications: true,
        procedures: true,
        alerts: true,
      },
      orderBy: [{ triageLevel: 'asc' }, { arrivalDate: 'asc' }],
    });
  }

  /**
   *
   */
  async getEmergencyVisitById(id: string) {
    const visit = await this.prisma.emergencyVisit.findUnique({
      where: { id },
      include: {
        patient: true,
        vitals: {
          orderBy: { timestamp: 'desc' },
        },
        medications: {
          orderBy: { prescribedAt: 'desc' },
        },
        procedures: {
          orderBy: { performedAt: 'desc' },
        },
        alerts: {
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });
    if (!visit) throw new NotFoundException('Emergency visit not found');
    return visit;
  }

  /**
   *
   */
  async updateTriage(id: string, triageData: any) {
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: {
        triageLevel: triageData.triageLevel,
        vitalSigns: triageData.vitalSigns,
        assessment: triageData.assessment,
      },
    });
  }

  /**
   *
   */
  async assignDoctor(id: string, doctorId: string) {
    // Note: Doctor assignment would need to be added to the schema
    // For now, we'll update the treatment field to indicate assignment
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: {
        treatment: `Assigned to doctor: ${doctorId}`,
      },
    });
  }

  /**
   *
   */
  async updateVisitStatus(id: string, disposition: string) {
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: {
        disposition: disposition as any,
        dischargeDate: disposition === 'DISCHARGED' ? new Date() : null,
      },
    });
  }

  /**
   *
   */
  async addVitals(visitId: string, vitals: any) {
    return this.prisma.emergencyVital.create({
      data: {
        visitId,
        ...vitals,
      },
    });
  }

  /**
   *
   */
  async addMedication(visitId: string, medication: any) {
    return this.prisma.emergencyMedication.create({
      data: {
        visitId,
        ...medication,
      },
    });
  }

  /**
   *
   */
  async addProcedure(visitId: string, procedure: any) {
    return this.prisma.emergencyProcedure.create({
      data: {
        visitId,
        ...procedure,
      },
    });
  }

  /**
   *
   */
  async getWaitingQueue() {
    return this.prisma.emergencyVisit.findMany({
      where: {
        // Patients still in emergency (not yet discharged, admitted, etc.)
        disposition: null,
      },
      include: { patient: true },
      orderBy: [{ triageLevel: 'asc' }, { arrivalDate: 'asc' }],
    });
  }

  /**
   *
   */
  private async triggerCriticalAlert(visitId: string) {
    // Create alert record and trigger notifications
    await this.prisma.emergencyAlert.create({
      data: {
        visitId,
        alertType: 'CRITICAL_PATIENT',
        message: 'Critical patient admitted to emergency',
        severity: 'HIGH',
        triggeredAt: new Date(),
      },
    });

    // Here you would integrate with notification system
    // to alert doctors, nurses, and administrators
  }
}
