import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConfig {
  constructor(private readonly configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY');
  }

  get publishableKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');
  }

  get webhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  get apiVersion(): string {
    return '2023-12-15';
  }

  get currency(): string {
    return 'usd';
  }

  get paymentMethods(): string[] {
    return ['card', 'alipay', 'wechat_pay'];
  }

  get webhookEvents(): string[] {
    return [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'customer.created',
      'customer.updated',
      'invoice.paid',
      'invoice.payment_failed',
      'subscription.created',
      'subscription.updated',
      'subscription.deleted',
      'checkout.session.completed',
    ];
  }

  get billingPortal(): {
    returnUrl: string;
    features: string[];
  } {
    return {
      returnUrl: this.configService.get<string>('FRONTEND_URL') + '/billing',
      features: ['invoice_history', 'payment_methods', 'subscription_cancel'],
    };
  }

  get fees(): {
    applicationFee: number;
    platformFee: number;
  } {
    return {
      applicationFee: 0.025, // 2.5%
      platformFee: 0.01, // 1%
    };
  }

  get testing(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  get testCards(): {
    success: string;
    decline: string;
    incomplete: string;
  } {
    return {
      success: '4242 4242 4242 4242',
      decline: '4000 0000 0000 0002',
      incomplete: '4000 0000 0000 0008',
    };
  }
}