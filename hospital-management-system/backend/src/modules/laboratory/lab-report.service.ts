import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

interface ReportData {
  labTest: any;
  patient: any;
  results: any[];
  generatedBy: string;
  reportType: 'PRELIMINARY' | 'FINAL' | 'AMENDED' | 'CORRECTED';
}

@Injectable()
export class LabReportService {
  private readonly reportsDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.reportsDir = path.join(process.cwd(), 'uploads', 'lab-reports');
    this.ensureReportsDirectory();
  }

  /**
   * Generate lab report PDF
   */
  async generateReport(
    labTestId: string,
    reportType: 'PRELIMINARY' | 'FINAL' | 'AMENDED' | 'CORRECTED' = 'FINAL',
    generatedBy: string,
  ): Promise<string> {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id: labTestId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        testCatalog: true,
        results: {
          orderBy: { performedDate: 'desc' },
        },
        samples: true,
      },
    });

    if (!labTest) {
      throw new NotFoundException('Lab test not found');
    }

    if (labTest.results.length === 0) {
      throw new BadRequestException('No results available for this test');
    }

    const reportData: ReportData = {
      labTest,
      patient: labTest.patient,
      results: labTest.results,
      generatedBy,
      reportType,
    };

    const reportNumber = await this.generateReportNumber();
    const fileName = `lab-report-${reportNumber}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);

    // Generate PDF
    await this.createPDFReport(reportData, filePath, reportNumber);

    // Save report record to database
    const report = await this.prisma.labReport.create({
      data: {
        labTestId,
        reportNumber,
        reportType,
        generatedDate: new Date(),
        generatedBy,
        filePath,
        fileSize: this.getFileSize(filePath),
        status: 'GENERATED',
      },
    });

    return report.id;
  }

  /**
   * Approve report
   */
  async approveReport(reportId: string, approvedBy: string): Promise<void> {
    const report = await this.prisma.labReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'GENERATED') {
      throw new BadRequestException('Report can only be approved when in GENERATED status');
    }

    await this.prisma.labReport.update({
      where: { id: reportId },
      data: {
        approvedBy,
        approvedDate: new Date(),
        status: 'APPROVED',
      },
    });
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string) {
    const report = await this.prisma.labReport.findUnique({
      where: { id: reportId },
      include: {
        labTest: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
            testCatalog: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Get reports for a test
   */
  async getReportsForTest(labTestId: string) {
    return this.prisma.labReport.findMany({
      where: { labTestId },
      orderBy: { generatedDate: 'desc' },
    });
  }

  /**
   * Download report file
   */
  async downloadReport(reportId: string): Promise<{ filePath: string; fileName: string }> {
    const report = await this.prisma.labReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!fs.existsSync(report.filePath)) {
      throw new NotFoundException('Report file not found');
    }

    return {
      filePath: report.filePath,
      fileName: path.basename(report.filePath),
    };
  }

  /**
   * Archive old reports
   */
  async archiveOldReports(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldReports = await this.prisma.labReport.findMany({
      where: {
        generatedDate: {
          lt: cutoffDate,
        },
        status: {
          in: ['APPROVED', 'PRINTED', 'DELIVERED'],
        },
      },
    });

    let archivedCount = 0;
    for (const report of oldReports) {
      // Move file to archive directory
      const archiveDir = path.join(this.reportsDir, 'archive');
      this.ensureDirectory(archiveDir);

      const archivePath = path.join(archiveDir, path.basename(report.filePath));

      if (fs.existsSync(report.filePath)) {
        fs.renameSync(report.filePath, archivePath);

        await this.prisma.labReport.update({
          where: { id: report.id },
          data: {
            filePath: archivePath,
            status: 'ARCHIVED',
          },
        });

        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * Create PDF report
   */
  private async createPDFReport(
    reportData: ReportData,
    filePath: string,
    reportNumber: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      try {
        this.addReportHeader(doc, reportData, reportNumber);
        this.addPatientInfo(doc, reportData);
        this.addTestInfo(doc, reportData);
        this.addResults(doc, reportData);
        this.addFooter(doc, reportData);

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private addReportHeader(
    doc: PDFKit.PDFDocument,
    reportData: ReportData,
    reportNumber: string,
  ): void {
    // Hospital Header
    doc.fontSize(20).font('Helvetica-Bold').text('HOSPITAL MANAGEMENT SYSTEM', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Laboratory Report', { align: 'center' });
    doc.moveDown(0.5);

    // Report Info
    doc.fontSize(10).font('Helvetica');
    doc.text(`Report Number: ${reportNumber}`, { align: 'right' });
    doc.text(`Report Type: ${reportData.reportType}`, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();
  }

  private addPatientInfo(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Patient Information');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    const patient = reportData.patient;
    const user = patient.user;

    const patientInfo = [
      `Name: ${user.firstName} ${user.lastName}`,
      `Patient ID: ${patient.mrn}`,
      `Date of Birth: ${patient.dateOfBirth.toLocaleDateString()}`,
      `Gender: ${patient.gender}`,
      `Phone: ${user.phone || 'N/A'}`,
    ];

    patientInfo.forEach(info => {
      doc.text(info);
    });

    doc.moveDown();
  }

  private addTestInfo(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Test Information');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    const labTest = reportData.labTest;
    const testCatalog = labTest.testCatalog;

    const testInfo = [
      `Test Name: ${testCatalog.testName}`,
      `Test Code: ${testCatalog.testCode}`,
      `Category: ${testCatalog.category}`,
      `Department: ${testCatalog.department}`,
      `Order Number: ${labTest.orderNumber}`,
      `Ordered Date: ${labTest.orderedDate.toLocaleString()}`,
      `Priority: ${labTest.priority}`,
    ];

    if (labTest.urgent) {
      testInfo.push('URGENT: Yes');
    }

    testInfo.forEach(info => {
      doc.text(info);
    });

    doc.moveDown();
  }

  private addResults(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('Test Results');
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    const colWidths = [150, 80, 80, 100, 80];

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Parameter', 50, tableTop);
    doc.text('Value', 200, tableTop);
    doc.text('Units', 280, tableTop);
    doc.text('Reference Range', 360, tableTop);
    doc.text('Flag', 460, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(520, tableTop + 15)
      .stroke();
    doc.moveDown();

    // Results
    doc.font('Helvetica');
    reportData.results.forEach((result, index) => {
      const y = doc.y;
      doc.text(result.parameter, 50, y);
      doc.text(result.value, 200, y);
      doc.text(result.units || '', 280, y);
      doc.text(result.referenceRange || '', 360, y);
      doc.text(result.flag || '', 460, y);

      if (index < reportData.results.length - 1) {
        doc
          .moveTo(50, y + 15)
          .lineTo(520, y + 15)
          .stroke();
      }
    });

    doc.moveDown(2);
  }

  private addFooter(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    const bottom = doc.page.height - 100;

    doc.fontSize(8).font('Helvetica');
    doc.text(
      'This report is confidential and intended for the specified patient only.',
      50,
      bottom,
    );
    doc.text('Generated by HMS Laboratory Information System', 50, bottom + 15);
    doc.text(`Generated by: ${reportData.generatedBy}`, 50, bottom + 30);
  }

  private async generateReportNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.labReport.count({
      where: {
        reportNumber: {
          startsWith: `RPT${dateStr}`,
        },
      },
    });

    return `RPT${dateStr}${(count + 1).toString().padStart(4, '0')}`;
  }

  private ensureReportsDirectory(): void {
    this.ensureDirectory(this.reportsDir);
  }

  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getFileSize(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    const tempDir = path.join(this.reportsDir, 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }
}
