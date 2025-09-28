import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class ExternalSystemsService {
  private readonly logger = new Logger(ExternalSystemsService.name);

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Get external system by ID
   */
  async getExternalSystem(id: string) {
    const system = await this.prisma.externalSystem.findUnique({
      where: { id },
    });

    if (!system) {
      throw new NotFoundException('External system not found');
    }

    return system;
  }

  /**
   * Get all external systems
   */
  async getExternalSystems(filters?: { type?: string; isActive?: boolean }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.externalSystem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create new external system
   */
  async createExternalSystem(data: {
    name: string;
    type: string;
    baseUrl: string;
    apiKey?: string;
    username?: string;
    password?: string;
    authType?: string;
    configuration?: any;
  }) {
    return this.prisma.externalSystem.create({
      data: {
        name: data.name,
        type: data.type as any,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        username: data.username,
        password: data.password, // In production, this should be encrypted
        authType: data.authType as any,
        configuration: data.configuration,
      },
    });
  }

  /**
   * Update external system
   */
  async updateExternalSystem(
    id: string,
    data: Partial<{
      name: string;
      baseUrl: string;
      apiKey: string;
      username: string;
      password: string;
      authType: AuthType;
      isActive: boolean;
      configuration: any;
    }>,
  ) {
    const system = await this.getExternalSystem(id);

    return this.prisma.externalSystem.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete external system
   */
  async deleteExternalSystem(id: string) {
    const system = await this.getExternalSystem(id);

    return this.prisma.externalSystem.delete({
      where: { id },
    });
  }

  /**
   * Send data to external system
   */
  async sendToExternalSystem(
    systemId: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<any> {
    const system = await this.getExternalSystem(systemId);

    if (!system.isActive) {
      throw new BadRequestException('External system is not active');
    }

    try {
      // Update sync status
      await this.updateSyncStatus(systemId, 'SYNCING');

      const url = `${system.baseUrl}${endpoint}`;
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add authentication
      if (system.authType === 'BASIC' && system.username && system.password) {
        const auth = Buffer.from(`${system.username}:${system.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else if (system.authType === 'BEARER' && system.apiKey) {
        headers['Authorization'] = `Bearer ${system.apiKey}`;
      } else if (system.authType === 'API_KEY' && system.apiKey) {
        headers['X-API-Key'] = system.apiKey;
      }

      const requestOptions: any = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      this.logger.log(`Sending ${method} request to ${url}`);

      // In a real implementation, you would use a HTTP client like axios
      // For now, we'll simulate the response
      const mockResponse = await this.simulateHttpRequest(url, requestOptions);

      // Update sync status
      await this.updateSyncStatus(systemId, 'SUCCESS', new Date());

      return mockResponse;
    } catch (error) {
      this.logger.error(`Failed to send data to external system: ${error.message}`, error.stack);

      // Update sync status
      await this.updateSyncStatus(systemId, 'FAILED', new Date(), error.message);

      throw error;
    }
  }

  /**
   * Receive data from external system
   */
  async receiveFromExternalSystem(systemId: string, endpoint: string): Promise<any> {
    return this.sendToExternalSystem(systemId, 'GET', endpoint);
  }

  /**
   * Test connection to external system
   */
  async testConnection(systemId: string): Promise<boolean> {
    try {
      const system = await this.getExternalSystem(systemId);

      // Try to access a basic endpoint (like /health or /status)
      await this.sendToExternalSystem(systemId, 'GET', '/health');
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed for system ${systemId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get sync status for external system
   */
  async getSyncStatus(systemId: string) {
    const system = await this.getExternalSystem(systemId);
    return {
      systemId,
      systemName: system.name,
      lastSync: system.lastSync,
      syncStatus: system.syncStatus,
      errorMessage: system.errorMessage,
    };
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(
    systemId: string,
    status: string,
    lastSync?: Date,
    errorMessage?: string,
  ) {
    const updateData: any = {
      syncStatus: status as any,
    };

    if (lastSync) {
      updateData.lastSync = lastSync;
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.prisma.externalSystem.update({
      where: { id: systemId },
      data: updateData,
    });
  }

  /**
   * Simulate HTTP request (replace with actual HTTP client in production)
   */
  private async simulateHttpRequest(url: string, options: any): Promise<any> {
    // This is a simulation - in production, use axios or fetch
    this.logger.log(`Simulating ${options.method} request to ${url}`);

    // Simulate different responses based on URL patterns
    if (url.includes('/Patient')) {
      if (options.method === 'POST') {
        return {
          id: `patient-${Date.now()}`,
          resourceType: 'Patient',
          ...JSON.parse(options.body),
        };
      } else if (options.method === 'GET') {
        return {
          resourceType: 'Bundle',
          type: 'searchset',
          total: 1,
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                id: '123',
                name: [{ family: 'Doe', given: ['John'] }],
              },
            },
          ],
        };
      }
    }

    if (url.includes('/health')) {
      return { status: 'ok', timestamp: new Date().toISOString() };
    }

    // Default response
    return { success: true, message: 'Request processed successfully' };
  }

  /**
   * Get external systems by type
   */
  async getSystemsByType(type: string) {
    return this.prisma.externalSystem.findMany({
      where: {
        type: type as any,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Bulk sync with external systems
   */
  async bulkSync(systems: string[], data: any) {
    const results = [];

    for (const systemId of systems) {
      try {
        const result = await this.sendToExternalSystem(systemId, 'POST', '/sync', data);
        results.push({
          systemId,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          systemId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
