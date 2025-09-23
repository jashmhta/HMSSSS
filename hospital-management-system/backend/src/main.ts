/*[object Object]*/
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

/**
 *
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Hospital Management System API')
    .setDescription('Comprehensive HMS API with 28+ modules')
    .setVersion('1.0')
    .addTag('auth', 'Authentication and authorization')
    .addTag('mfa', 'Multi-factor authentication')
    .addTag('patients', 'Patient management')
    .addTag('staff', 'Staff management (doctors, nurses, etc.)')
    .addTag('appointments', 'Appointment scheduling')
    .addTag('medical-records', 'Medical records management')
    .addTag('pharmacy', 'Pharmacy management')
    .addTag('inventory', 'Inventory and medication management')
    .addTag('laboratory', 'Lab test management')
    .addTag('radiology', 'Radiology test management')
    .addTag('opd', 'Outpatient department management')
    .addTag('ipd', 'Inpatient department management')
    .addTag('ot', 'Operating theater management')
    .addTag('emergency', 'Emergency department')
    .addTag('blood-bank', 'Blood bank management')
    .addTag('billing', 'Billing and invoicing')
    .addTag('accounting', 'Accounting and financial reports')
    .addTag('price-estimator', 'Price estimation tools')
    .addTag('superadmin', 'Superadmin control panel')
    .addTag('reports', 'Analytics and reporting')
    .addTag('compliance', 'HIPAA/GDPR compliance monitoring')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 HMS Backend running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
}

bootstrap();
