import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { PacsService } from './pacs.service';
import { PacsIntegrationService } from './pacs-integration.service';
import { DicomService } from './dicom.service';

/**
 *
 */
@Controller('pacs')
export class PacsController {
  /**
   *
   */
  constructor(
    private readonly pacsService: PacsService,
    private readonly pacsIntegrationService: PacsIntegrationService,
    private readonly dicomService: DicomService,
  ) {}

  /**
   * Upload and store DICOM file
   */
  @Post('dicom/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDICOMFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { patientId: string },
  ) {
    // Validate DICOM file
    const isValid = await this.dicomService.validateDICOMFile(file.buffer);
    if (!isValid) {
      throw new Error('Invalid DICOM file');
    }

    // Parse DICOM metadata
    const metadata = await this.dicomService.parseDICOMMetadata(file.buffer);

    // Store study
    const study = await this.pacsService.storeDICOMStudy({
      patientId: body.patientId,
      studyInstanceUID: metadata.studyInstanceUID,
      studyDescription: metadata.studyDescription,
      studyDate: metadata.studyDate,
      modality: metadata.modality,
      bodyPart: metadata.bodyPart,
      institutionName: metadata.institutionName,
      dicomMetadata: metadata,
    });

    // Store series
    const series = await this.pacsService.storeDICOMSeries({
      studyId: study.id,
      seriesInstanceUID: metadata.seriesInstanceUID,
      seriesDescription: metadata.seriesDescription,
      modality: metadata.modality,
      bodyPart: metadata.bodyPart,
      seriesDate: metadata.seriesDate,
      dicomMetadata: metadata,
    });

    // Store instance
    const instance = await this.pacsService.storeDICOMInstance({
      seriesId: series.id,
      sopInstanceUID: metadata.sopInstanceUID,
      sopClassUID: metadata.sopClassUID,
      filePath: `/dicom/${study.id}/${series.id}/${metadata.sopInstanceUID}.dcm`,
      fileSize: file.size,
      dicomMetadata: metadata,
    });

    return {
      study,
      series,
      instance,
      message: 'DICOM file uploaded successfully',
    };
  }

  /**
   * Get DICOM study
   */
  @Get('studies/:studyId')
  async getDICOMStudy(@Param('studyId') studyId: string) {
    return this.pacsService.getDICOMStudy(studyId);
  }

  /**
   * Get patient DICOM studies
   */
  @Get('patients/:patientId/studies')
  async getPatientDICOMStudies(
    @Param('patientId') patientId: string,
    @Query()
    query: {
      modality?: string;
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
    },
  ) {
    return this.pacsService.getPatientDICOMStudies(patientId, query);
  }

  /**
   * Search DICOM studies
   */
  @Get('studies')
  async searchDICOMStudies(
    @Query()
    query: {
      patientId?: string;
      accessionNumber?: string;
      studyInstanceUID?: string;
      modality?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    return this.pacsService.searchDICOMStudies(query);
  }

  /**
   * Get DICOM image
   */
  @Get('instances/:instanceId/image')
  async getDICOMImage(@Param('instanceId') instanceId: string) {
    return this.pacsService.getDICOMImage(instanceId);
  }

  /**
   * Sync study with PACS
   */
  @Post('studies/:studyId/sync/:pacsId')
  async syncWithPACS(@Param('studyId') studyId: string, @Param('pacsId') pacsId: string) {
    return this.pacsService.syncWithPACS(studyId, pacsId);
  }

  /**
   * Export DICOM study
   */
  @Get('studies/:studyId/export')
  async exportDICOMStudy(
    @Param('studyId') studyId: string,
    @Query('format') format: 'dicom' | 'jpeg' | 'png' = 'dicom',
  ) {
    return this.pacsService.exportDICOMStudy(studyId, format);
  }

  /**
   * Get PACS statistics
   */
  @Get('statistics')
  async getPACSStatistics() {
    return this.pacsService.getPACSStatistics();
  }

  /**
   * Get PACS systems
   */
  @Get('systems')
  async getPACSSystems(@Query() query: { isActive?: boolean }) {
    const isActive = query.isActive !== undefined ? query.isActive === true : undefined;
    return this.pacsIntegrationService.getPACSSystems({ isActive });
  }

  /**
   * Create PACS system
   */
  @Post('systems')
  async createPACSSystem(
    @Body()
    body: {
      systemName: string;
      baseUrl: string;
      aetitle: string;
      port?: number;
      apiKey?: string;
      configuration?: any;
    },
  ) {
    return this.pacsIntegrationService.createPACSSystem(body);
  }

  /**
   * Update PACS system
   */
  @Put('systems/:systemId')
  async updatePACSSystem(
    @Param('systemId') systemId: string,
    @Body()
    body: Partial<{
      systemName: string;
      baseUrl: string;
      aetitle: string;
      port: number;
      apiKey: string;
      isActive: boolean;
      configuration: any;
    }>,
  ) {
    return this.pacsIntegrationService.updatePACSSystem(systemId, body);
  }

  /**
   * Delete PACS system
   */
  @Delete('systems/:systemId')
  async deletePACSSystem(@Param('systemId') systemId: string) {
    return this.pacsIntegrationService.deletePACSSystem(systemId);
  }

  /**
   * Test PACS connection
   */
  @Post('systems/:systemId/test')
  async testPACSConnection(@Param('systemId') systemId: string) {
    const success = await this.pacsIntegrationService.testPACSConnection(systemId);
    return { systemId, connectionTest: success ? 'SUCCESS' : 'FAILED' };
  }

  /**
   * Query PACS
   */
  @Post('systems/:systemId/query')
  async queryPACS(
    @Param('systemId') systemId: string,
    @Body()
    query: {
      patientId?: string;
      accessionNumber?: string;
      studyDate?: Date;
      modality?: string;
    },
  ) {
    return this.pacsIntegrationService.queryPACS(systemId, query);
  }

  /**
   * Retrieve from PACS
   */
  @Post('systems/:systemId/retrieve/:studyInstanceUID')
  async retrieveFromPACS(
    @Param('systemId') systemId: string,
    @Param('studyInstanceUID') studyInstanceUID: string,
  ) {
    return this.pacsIntegrationService.retrieveFromPACS(systemId, studyInstanceUID);
  }

  /**
   * Get PACS sync status
   */
  @Get('systems/:systemId/sync-status')
  async getPACSSyncStatus(@Param('systemId') systemId: string) {
    return this.pacsIntegrationService.getPACSSyncStatus(systemId);
  }

  /**
   * Bulk sync with PACS
   */
  @Post('systems/:systemId/bulk-sync')
  async bulkSyncWithPACS(
    @Param('systemId') systemId: string,
    @Body() body: { studyIds: string[] },
  ) {
    return this.pacsIntegrationService.bulkSyncWithPACS(systemId, body.studyIds);
  }
}
