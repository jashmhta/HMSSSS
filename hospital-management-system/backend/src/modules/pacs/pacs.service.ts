import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import { DicomService } from './dicom.service';
import { PacsIntegrationService } from './pacs-integration.service';

/**
 *
 */
@Injectable()
export class PacsService {
  private readonly logger = new Logger(PacsService.name);

  /**
   *
   */
  constructor(
    private prisma: PrismaService,
    private dicomService: DicomService,
    private pacsIntegrationService: PacsIntegrationService,
  ) {}

  /**
   * Store DICOM study
   */
  async storeDICOMStudy(data: {
    patientId: string;
    studyInstanceUID: string;
    accessionNumber?: string;
    studyDescription?: string;
    studyDate?: Date;
    modality?: string;
    bodyPart?: string;
    referringPhysician?: string;
    performingPhysician?: string;
    institutionName?: string;
    dicomMetadata?: any;
  }) {
    try {
      // Verify patient exists
      const patient = await this.prisma.patient.findUnique({
        where: { id: data.patientId },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Check if study already exists
      const existingStudy = await this.prisma.dICOMStudy.findUnique({
        where: { studyInstanceUID: data.studyInstanceUID },
      });

      if (existingStudy) {
        // Update existing study
        return this.prisma.dICOMStudy.update({
          where: { studyInstanceUID: data.studyInstanceUID },
          data: {
            patientId: data.patientId,
            accessionNumber: data.accessionNumber,
            studyDescription: data.studyDescription,
            studyDate: data.studyDate,
            modality: data.modality as any,
            bodyPart: data.bodyPart,
            referringPhysician: data.referringPhysician,
            performingPhysician: data.performingPhysician,
            institutionName: data.institutionName,
            metadata: data.dicomMetadata,
            status: 'STORED',
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new study
        return this.prisma.dICOMStudy.create({
          data: {
            patientId: data.patientId,
            studyInstanceUID: data.studyInstanceUID,
            accessionNumber: data.accessionNumber,
            studyDescription: data.studyDescription,
            studyDate: data.studyDate,
            modality: data.modality as any,
            bodyPart: data.bodyPart,
            referringPhysician: data.referringPhysician,
            performingPhysician: data.performingPhysician,
            institutionName: data.institutionName,
            metadata: data.dicomMetadata,
            status: 'STORED',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to store DICOM study: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Store DICOM series
   */
  async storeDICOMSeries(data: {
    studyId: string;
    seriesInstanceUID: string;
    seriesNumber?: string;
    seriesDescription?: string;
    modality?: string;
    bodyPart?: string;
    seriesDate?: Date;
    dicomMetadata?: any;
  }) {
    try {
      // Verify study exists
      const study = await this.prisma.dICOMStudy.findUnique({
        where: { id: data.studyId },
      });

      if (!study) {
        throw new NotFoundException('DICOM study not found');
      }

      // Check if series already exists
      const existingSeries = await this.prisma.dICOMSeries.findUnique({
        where: { seriesInstanceUID: data.seriesInstanceUID },
      });

      if (existingSeries) {
        // Update existing series
        return this.prisma.dICOMSeries.update({
          where: { seriesInstanceUID: data.seriesInstanceUID },
          data: {
            seriesNumber: data.seriesNumber,
            seriesDescription: data.seriesDescription,
            modality: data.modality as any,
            bodyPart: data.bodyPart,
            seriesDate: data.seriesDate,
            metadata: data.dicomMetadata,
            status: 'STORED',
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new series
        return this.prisma.dICOMSeries.create({
          data: {
            studyId: data.studyId,
            seriesInstanceUID: data.seriesInstanceUID,
            seriesNumber: data.seriesNumber,
            seriesDescription: data.seriesDescription,
            modality: data.modality as any,
            bodyPart: data.bodyPart,
            seriesDate: data.seriesDate,
            metadata: data.dicomMetadata,
            status: 'STORED',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to store DICOM series: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Store DICOM instance
   */
  async storeDICOMInstance(data: {
    seriesId: string;
    sopInstanceUID: string;
    instanceNumber?: string;
    sopClassUID?: string;
    filePath: string;
    fileSize?: number;
    dicomMetadata?: any;
  }) {
    try {
      // Verify series exists
      const series = await this.prisma.dICOMSeries.findUnique({
        where: { id: data.seriesId },
      });

      if (!series) {
        throw new NotFoundException('DICOM series not found');
      }

      // Check if instance already exists
      const existingInstance = await this.prisma.dICOMInstance.findUnique({
        where: { sopInstanceUID: data.sopInstanceUID },
      });

      if (existingInstance) {
        // Update existing instance
        return this.prisma.dICOMInstance.update({
          where: { sopInstanceUID: data.sopInstanceUID },
          data: {
            instanceNumber: data.instanceNumber,
            sopClassUID: data.sopClassUID,
            storagePath: data.filePath,
            fileSize: data.fileSize,
            metadata: data.dicomMetadata,
            status: 'STORED',
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new instance
        return this.prisma.dICOMInstance.create({
          data: {
            seriesId: data.seriesId,
            sopInstanceUID: data.sopInstanceUID,
            instanceNumber: data.instanceNumber,
            sopClassUID: data.sopClassUID,
            storagePath: data.filePath,
            fileSize: data.fileSize,
            metadata: data.dicomMetadata,
            status: 'STORED',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to store DICOM instance: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get DICOM study by ID
   */
  async getDICOMStudy(studyId: string) {
    const study = await this.prisma.dICOMStudy.findUnique({
      where: { id: studyId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        series: {
          include: {
            instances: true,
          },
        },
      },
    });

    if (!study) {
      throw new NotFoundException('DICOM study not found');
    }

    return study;
  }

  /**
   * Get DICOM studies for patient
   */
  async getPatientDICOMStudies(
    patientId: string,
    filters?: {
      modality?: string;
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
    },
  ) {
    const where: any = { patientId };

    if (filters?.modality) {
      where.modality = filters.modality;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.studyDate = {};
      if (filters.dateFrom) {
        where.studyDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.studyDate.lte = filters.dateTo;
      }
    }

    return this.prisma.dICOMStudy.findMany({
      where,
      include: {
        series: {
          include: {
            instances: true,
          },
        },
      },
      orderBy: { studyDate: 'desc' },
    });
  }

  /**
   * Search DICOM studies
   */
  async searchDICOMStudies(searchParams: {
    patientId?: string;
    accessionNumber?: string;
    studyInstanceUID?: string;
    modality?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...filters } = searchParams;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.accessionNumber) {
      where.accessionNumber = { contains: filters.accessionNumber, mode: 'insensitive' };
    }

    if (filters.studyInstanceUID) {
      where.studyInstanceUID = { contains: filters.studyInstanceUID, mode: 'insensitive' };
    }

    if (filters.modality) {
      where.modality = filters.modality;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.studyDate = {};
      if (filters.dateFrom) {
        where.studyDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.studyDate.lte = filters.dateTo;
      }
    }

    const [studies, total] = await Promise.all([
      this.prisma.dICOMStudy.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          series: {
            include: {
              instances: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { studyDate: 'desc' },
      }),
      this.prisma.dICOMStudy.count({ where }),
    ]);

    return {
      data: studies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get DICOM image data
   */
  async getDICOMImage(instanceId: string) {
    const instance = await this.prisma.dICOMInstance.findUnique({
      where: { id: instanceId },
      include: {
        series: {
          include: {
            study: {
              include: {
                patient: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('DICOM instance not found');
    }

    // In a real implementation, you would read the DICOM file from storage
    // For now, return metadata
    return {
      instance: instance,
      study: instance.series.study,
      patient: instance.series.study.patient,
      imageData: null, // Would contain actual image data
    };
  }

  /**
   * Sync DICOM study with PACS
   */
  async syncWithPACS(studyId: string, pacsSystemId: string) {
    try {
      const study = await this.getDICOMStudy(studyId);
      return this.pacsIntegrationService.sendToPACS(pacsSystemId, study);
    } catch (error) {
      this.logger.error(`Failed to sync study ${studyId} with PACS: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get PACS statistics
   */
  async getPACSStatistics() {
    const [totalStudies, totalSeries, totalInstances, studiesByModality] = await Promise.all([
      this.prisma.dICOMStudy.count(),
      this.prisma.dICOMSeries.count(),
      this.prisma.dICOMInstance.count(),
      this.prisma.dICOMStudy.groupBy({
        by: ['modality'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),
    ]);

    return {
      totalStudies,
      totalSeries,
      totalInstances,
      studiesByModality: studiesByModality.map(item => ({
        modality: item.modality,
        count: item._count.id,
      })),
    };
  }

  /**
   * Delete DICOM study (soft delete)
   */
  async deleteDICOMStudy(studyId: string) {
    const study = await this.prisma.dICOMStudy.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      throw new NotFoundException('DICOM study not found');
    }

    // Mark as deleted (soft delete)
    return this.prisma.dICOMStudy.update({
      where: { id: studyId },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Export DICOM study
   */
  async exportDICOMStudy(studyId: string, format: 'dicom' | 'jpeg' | 'png' = 'dicom') {
    const study = await this.getDICOMStudy(studyId);

    // In a real implementation, you would export the DICOM files
    // For now, return study metadata
    return {
      study,
      exportFormat: format,
      exportedAt: new Date(),
      // Would include download URLs or file paths
    };
  }
}
