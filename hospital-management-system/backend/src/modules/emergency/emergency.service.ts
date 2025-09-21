import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmergencyService {
  constructor(private prisma: PrismaService) {}

  async registerEmergencyPatient(data: any) {
    // Create emergency visit with high priority
    const emergencyVisit = await this.prisma.emergencyVisit.create({
      data: {
        ...data,
        priority: data.priority || 'HIGH',
        status: 'TRIAGE',
      },
    });

    // Trigger critical alerts if priority is critical
    if (data.priority === 'CRITICAL') {
      await this.triggerCriticalAlert(emergencyVisit.id);
    }

    return emergencyVisit;
  }

  async getEmergencyVisits() {
    return this.prisma.emergencyVisit.findMany({
      include: { patient: true, triageNurse: true, treatingDoctor: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getEmergencyVisitById(id: string) {
    const visit = await this.prisma.emergencyVisit.findUnique({
      where: { id },
      include: {
        patient: true,
        triageNurse: true,
        treatingDoctor: true,
        vitals: true,
        medications: true,
        procedures: true,
      },
    });
    if (!visit) throw new NotFoundException('Emergency visit not found');
    return visit;
  }

  async updateTriage(id: string, triageData: any) {
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: {
        ...triageData,
        status: 'TRIAGED',
        triagedAt: new Date(),
      },
    });
  }

  async assignDoctor(id: string, doctorId: string) {
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: {
        doctorId,
        status: 'ASSIGNED',
      },
    });
  }

  async updateVisitStatus(id: string, status: string) {
    return this.prisma.emergencyVisit.update({
      where: { id },
      data: { status },
    });
  }

  async addVitals(visitId: string, vitals: any) {
    return this.prisma.emergencyVital.create({
      data: {
        visitId,
        ...vitals,
      },
    });
  }

  async addMedication(visitId: string, medication: any) {
    return this.prisma.emergencyMedication.create({
      data: {
        visitId,
        ...medication,
      },
    });
  }

  async addProcedure(visitId: string, procedure: any) {
    return this.prisma.emergencyProcedure.create({
      data: {
        visitId,
        ...procedure,
      },
    });
  }

  async getWaitingQueue() {
    return this.prisma.emergencyVisit.findMany({
      where: { status: { in: ['TRIAGE', 'TRIAGED', 'WAITING'] } },
      include: { patient: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  private async triggerCriticalAlert(visitId: string) {
    // Create alert record and trigger notifications
    await this.prisma.emergencyAlert.create({
      data: {
        visitId,
        alertType: 'CRITICAL_PATIENT',
        message: 'Critical patient admitted to emergency',
        triggeredAt: new Date(),
      },
    });

    // Here you would integrate with notification system
    // to alert doctors, nurses, and administrators
  }
}
