import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioConfig {
  constructor(private readonly configService: ConfigService) {}

  get accountSid(): string {
    return this.configService.get<string>('TWILIO_ACCOUNT_SID');
  }

  get authToken(): string {
    return this.configService.get<string>('TWILIO_AUTH_TOKEN');
  }

  get phoneNumber(): string {
    return this.configService.get<string>('TWILIO_PHONE_NUMBER');
  }

  get messagingServiceId(): string {
    return this.configService.get<string>('TWILIO_MESSAGING_SERVICE_ID');
  }

  get region(): string {
    return 'us1';
  }

  get edge(): string {
    return 'ashburn';
  }

  get messaging(): {
    maxPrice: number;
    alphaSender: string;
    smartEncoded: boolean;
    scheduleType: string;
  } {
    return {
      maxPrice: 0.05,
      alphaSender: 'HMS',
      smartEncoded: true,
      scheduleType: 'fixed',
    };
  }

  get templates(): {
    appointmentReminder: string;
    appointmentConfirmation: string;
    appointmentCancellation: string;
    testResultReady: string;
    prescriptionReady: string;
    billingReminder: string;
    emergencyAlert: string;
  } {
    return {
      appointmentReminder: `Your appointment with HMS is scheduled for {date} at {time}. Reply CONFIRM to confirm or CANCEL to reschedule.`,
      appointmentConfirmation: `Your HMS appointment for {date} at {time} has been confirmed. Location: {location}. Please arrive 15 minutes early.`,
      appointmentCancellation: `Your HMS appointment for {date} at {time} has been cancelled. Contact {phone} to reschedule.`,
      testResultReady: `Your HMS test results are ready. Access them securely through your patient portal at {portal_url}.`,
      prescriptionReady: `Your prescription(s) from HMS are ready for pickup at {pharmacy}. Order number: {order_number}.`,
      billingReminder: `Reminder: Your HMS invoice {invoice_number} for ${amount} is due on {due_date}. Pay online at {payment_url}.`,
      emergencyAlert: `EMERGENCY: Patient {patient_name} requires immediate attention. Contact {emergency_contact} immediately.`,
    };
  }

  get rateLimits(): {
    perMinute: number;
    perHour: number;
    perDay: number;
  } {
    return {
      perMinute: 10,
      perHour: 100,
      perDay: 1000,
    };
  }

  get testing(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  get testNumbers(): string[] {
    return [
      '+15005550006', // SMS-capable
      '+15005550007', // Voice-capable
    ];
  }

  get voice(): {
    callerId: string;
    timeLimit: number;
    recording: boolean;
  } {
    return {
      callerId: this.phoneNumber,
      timeLimit: 1800, // 30 minutes
      recording: true,
    };
  }

  get compliance(): {
    doNotCall: boolean;
    tcpa: boolean;
    hipaa: boolean;
  } {
    return {
      doNotCall: true,
      tcpa: true,
      hipaa: this.configService.get<boolean>('HIPAA_ENABLED'),
    };
  }
}