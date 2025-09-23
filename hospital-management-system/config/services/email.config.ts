import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfig {
  constructor(private readonly configService: ConfigService) {}

  get smtp(): {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  } {
    return {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };
  }

  get from(): {
    address: string;
    name: string;
  } {
    return {
      address: this.configService.get<string>('SMTP_FROM'),
      name: this.configService.get<string>('SMTP_NAME'),
    };
  }

  get templates(): {
    appointmentConfirmation: string;
    appointmentReminder: string;
    appointmentCancellation: string;
    testResultReady: string;
    prescriptionReady: string;
    billingReminder: string;
    passwordReset: string;
    welcomeEmail: string;
    emergencyAlert: string;
  } {
    return {
      appointmentConfirmation: 'appointment-confirmation',
      appointmentReminder: 'appointment-reminder',
      appointmentCancellation: 'appointment-cancellation',
      testResultReady: 'test-result-ready',
      prescriptionReady: 'prescription-ready',
      billingReminder: 'billing-reminder',
      passwordReset: 'password-reset',
      welcomeEmail: 'welcome-email',
      emergencyAlert: 'emergency-alert',
    };
  }

  get bcc(): string {
    return this.configService.get<string>('EMAIL_BCC_ADMIN');
  }

  get templateDir(): string {
    return this.configService.get<string>('EMAIL_TEMPLATE_DIR');
  }

  get security(): {
    tls: {
      rejectUnauthorized: boolean;
    };
    dkim: {
      domainName: string;
      keySelector: string;
      privateKey: string;
    };
  } {
    return {
      tls: {
        rejectUnauthorized: true,
      },
      dkim: {
        domainName: this.configService.get<string>('FRONTEND_URL').replace('https://', '').replace('http://', ''),
        keySelector: 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY || '',
      },
    };
  }

  get rateLimits(): {
    perMinute: number;
    perHour: number;
    perDay: number;
  } {
    return {
      perMinute: 100,
      perHour: 1000,
      perDay: 10000,
    };
  }

  get testing(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  get testRecipient(): string {
    return this.configService.get<string>('SMTP_USER');
  }

  get attachments(): {
    maxSize: number;
    allowedTypes: string[];
  } {
    return {
      maxSize: 10485760, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };
  }

  get queue(): {
    priority: 'high' | 'normal' | 'low';
    retryAttempts: number;
    retryDelay: number;
  } {
    return {
      priority: 'normal',
      retryAttempts: 3,
      retryDelay: 5000,
    };
  }

  get compliance(): {
    hipaa: boolean;
    gdpr: boolean;
    unsubscribeRequired: boolean;
  } {
    return {
      hipaa: this.configService.get<boolean>('HIPAA_ENABLED'),
      gdpr: this.configService.get<boolean>('GDPR_ENABLED'),
      unsubscribeRequired: true,
    };
  }
}