import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as https from 'https';
import { CircuitBreaker } from 'opossum';

interface GovernmentAPIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    period: number; // in milliseconds
  };
}

@Injectable()
export class GovernmentAPIService {
  private readonly logger = new Logger(GovernmentAPIService.name);
  private clients: Map<string, AxiosInstance> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiters: Map<string, { requests: number[]; limit: number; period: number }> =
    new Map();

  private readonly apiConfigs: GovernmentAPIConfig[] = [
    {
      name: 'CMS_BLUEBUTTON',
      baseUrl: 'https://sandbox.bluebutton.cms.gov',
      timeout: 30000,
      retries: 3,
      rateLimit: { requests: 100, period: 60000 }, // 100 requests per minute
    },
    {
      name: 'FDA_OPENFDA',
      baseUrl: 'https://api.fda.gov',
      timeout: 30000,
      retries: 3,
      rateLimit: { requests: 240, period: 60000 }, // 240 requests per minute
    },
    {
      name: 'CDC_WONDER',
      baseUrl: 'https://wonder.cdc.gov',
      timeout: 60000,
      retries: 2,
      rateLimit: { requests: 10, period: 60000 }, // 10 requests per minute
    },
    {
      name: 'NIH_CLINICALTRIALS',
      baseUrl: 'https://clinicaltrials.gov/api',
      timeout: 30000,
      retries: 3,
      rateLimit: { requests: 100, period: 60000 },
    },
    {
      name: 'HHS_SYNTHEA',
      baseUrl: 'https://synthetichealth.github.io/synthea-sample-data',
      timeout: 30000,
      retries: 3,
      rateLimit: { requests: 100, period: 60000 },
    },
  ];

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    for (const config of this.apiConfigs) {
      // Create axios client
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        httpsAgent: new https.Agent({
          rejectUnauthorized: true, // Always verify SSL certificates
        }),
        headers: {
          'User-Agent': 'HMS-Integration/1.0',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // Add authentication if configured
      if (config.apiKey) {
        client.defaults.headers.common['X-API-Key'] = config.apiKey;
      }

      this.clients.set(config.name, client);

      // Initialize circuit breaker
      const breaker = new CircuitBreaker(
        async (requestFn: () => Promise<any>) => {
          return await requestFn();
        },
        {
          timeout: config.timeout,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
          name: config.name,
        },
      );

      breaker.on('open', () => this.logger.warn(`Circuit breaker opened for ${config.name}`));
      breaker.on('halfOpen', () => this.logger.log(`Circuit breaker half-open for ${config.name}`));
      breaker.on('close', () => this.logger.log(`Circuit breaker closed for ${config.name}`));

      this.circuitBreakers.set(config.name, breaker);

      // Initialize rate limiter
      this.rateLimiters.set(config.name, {
        requests: [],
        limit: config.rateLimit.requests,
        period: config.rateLimit.period,
      });
    }
  }

  private async checkRateLimit(apiName: string): Promise<void> {
    const limiter = this.rateLimiters.get(apiName);
    if (!limiter) return;

    const now = Date.now();
    // Remove old requests outside the period
    limiter.requests = limiter.requests.filter(time => now - time < limiter.period);

    if (limiter.requests.length >= limiter.limit) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limiter.period - (now - oldestRequest);
      throw new HttpException(
        `Rate limit exceeded for ${apiName}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    limiter.requests.push(now);
  }

  private async makeRequestWithRetry(
    apiName: string,
    requestFn: () => Promise<AxiosResponse>,
    retries: number = 3,
  ): Promise<AxiosResponse> {
    const breaker = this.circuitBreakers.get(apiName);
    if (!breaker) {
      throw new Error(`Circuit breaker not found for ${apiName}`);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.checkRateLimit(apiName);

        const response = await breaker.fire(requestFn);
        return response;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed for ${apiName}: ${error.message}`);

        if (attempt === retries) {
          throw new HttpException(
            `Failed to connect to ${apiName} after ${retries} attempts: ${error.message}`,
            HttpStatus.BAD_GATEWAY,
          );
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // CMS Blue Button API - Patient Data
  async getPatientDataFromCMS(patientId: string, beneficiaryId?: string): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('CMS_BLUEBUTTON', async () => {
        const client = this.clients.get('CMS_BLUEBUTTON');
        return client.get(`/v1/Patient/${patientId}`, {
          params: beneficiaryId ? { beneficiaryId } : {},
        });
      });

      return {
        source: 'CMS_BLUEBUTTON',
        patientId,
        data: response.data,
        retrievedAt: new Date(),
        compliance: ['HIPAA', 'HITECH'],
      };
    } catch (error) {
      this.logger.error(`Failed to get patient data from CMS: ${error.message}`);
      throw error;
    }
  }

  // CMS Blue Button API - Coverage Information
  async getCoverageFromCMS(patientId: string): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('CMS_BLUEBUTTON', async () => {
        const client = this.clients.get('CMS_BLUEBUTTON');
        return client.get(`/v1/Coverage`, {
          params: { patient: patientId },
        });
      });

      return {
        source: 'CMS_BLUEBUTTON',
        patientId,
        coverage: response.data,
        retrievedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get coverage from CMS: ${error.message}`);
      throw error;
    }
  }

  // FDA OpenFDA API - Drug Information
  async getDrugInfoFromFDA(drugName: string): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('FDA_OPENFDA', async () => {
        const client = this.clients.get('FDA_OPENFDA');
        return client.get('/drug/label.json', {
          params: {
            search: `openfda.brand_name:"${drugName}"`,
            limit: 1,
          },
        });
      });

      return {
        source: 'FDA_OPENFDA',
        drugName,
        data: response.data,
        retrievedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get drug info from FDA: ${error.message}`);
      throw error;
    }
  }

  // FDA OpenFDA API - Adverse Events
  async getAdverseEventsFromFDA(drugName: string, limit: number = 10): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('FDA_OPENFDA', async () => {
        const client = this.clients.get('FDA_OPENFDA');
        return client.get('/drug/event.json', {
          params: {
            search: `patient.drug.medicinalproduct:"${drugName}"`,
            limit,
          },
        });
      });

      return {
        source: 'FDA_OPENFDA',
        drugName,
        adverseEvents: response.data,
        retrievedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get adverse events from FDA: ${error.message}`);
      throw error;
    }
  }

  // CDC WONDER API - Health Statistics
  async getHealthStatsFromCDC(query: any): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('CDC_WONDER', async () => {
        const client = this.clients.get('CDC_WONDER');
        return client.post('/controller/datarequest/D76', query, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      });

      return {
        source: 'CDC_WONDER',
        query,
        data: response.data,
        retrievedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get health stats from CDC: ${error.message}`);
      throw error;
    }
  }

  // NIH Clinical Trials API
  async searchClinicalTrials(condition: string, limit: number = 20): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('NIH_CLINICALTRIALS', async () => {
        const client = this.clients.get('NIH_CLINICALTRIALS');
        return client.get('/query/study_fields', {
          params: {
            expr: condition,
            fields:
              'NCTId,BriefTitle,OverallStatus,Condition,InterventionType,InterventionName,LocationFacility,LocationCity,LocationState,LocationCountry',
            fmt: 'json',
            max_rnk: limit,
          },
        });
      });

      return {
        source: 'NIH_CLINICALTRIALS',
        condition,
        trials: response.data,
        retrievedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to search clinical trials: ${error.message}`);
      throw error;
    }
  }

  // Synthea Synthetic Data API
  async getSyntheticPatientData(count: number = 1): Promise<any> {
    try {
      const response = await this.makeRequestWithRetry('HHS_SYNTHEA', async () => {
        const client = this.clients.get('HHS_SYNTHEA');
        return client.get(`/api/generate-patients/${count}`);
      });

      return {
        source: 'HHS_SYNTHEA',
        count,
        patients: response.data,
        retrievedAt: new Date(),
        note: 'Synthetic data for testing purposes only',
      };
    } catch (error) {
      this.logger.error(`Failed to get synthetic patient data: ${error.message}`);
      throw error;
    }
  }

  // Compliance and Monitoring Methods
  async getAPIHealthStatus(): Promise<any> {
    const status = {};

    for (const [apiName, breaker] of this.circuitBreakers.entries()) {
      const limiter = this.rateLimiters.get(apiName);
      status[apiName] = {
        circuitBreakerState: breaker.stats.state,
        rateLimitRemaining: limiter ? limiter.limit - limiter.requests.length : 'N/A',
        lastFailure: breaker.stats.failedRequests,
        totalRequests: breaker.stats.fires,
      };
    }

    return status;
  }

  async validateAPICompliance(): Promise<any> {
    const complianceChecks = [];

    // Check SSL/TLS compliance
    for (const [apiName, client] of this.clients.entries()) {
      try {
        // Test connection with SSL validation
        await client.get('/health', { timeout: 5000 });
        complianceChecks.push({
          api: apiName,
          check: 'SSL_TLS_COMPLIANCE',
          status: 'PASS',
          details: 'SSL/TLS connection successful',
        });
      } catch (error) {
        complianceChecks.push({
          api: apiName,
          check: 'SSL_TLS_COMPLIANCE',
          status: 'FAIL',
          details: `SSL/TLS validation failed: ${error.message}`,
        });
      }
    }

    // Check rate limiting compliance
    for (const [apiName, limiter] of this.rateLimiters.entries()) {
      const currentRequests = limiter.requests.filter(
        time => Date.now() - time < limiter.period,
      ).length;
      complianceChecks.push({
        api: apiName,
        check: 'RATE_LIMIT_COMPLIANCE',
        status: currentRequests <= limiter.limit ? 'PASS' : 'FAIL',
        details: `${currentRequests}/${limiter.limit} requests in period`,
      });
    }

    return complianceChecks;
  }
}
