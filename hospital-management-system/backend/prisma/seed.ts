import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Hospital Management System database...');

  // Hash passwords with enterprise-grade security
  const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12); // Use 12 rounds for production
  };

  // Clear existing data (in development mode)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.dataRetentionLog.deleteMany();
    await prisma.complianceCheck.deleteMany();
    await prisma.inventoryLog.deleteMany();
    await prisma.billItem.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.surgery.deleteMany();
    await prisma.operatingTheater.deleteMany();
    await prisma.opdVisit.deleteMany();
    await prisma.emergencyVisit.deleteMany();
    await prisma.labReport.deleteMany();
    await prisma.labResult.deleteMany();
    await prisma.labSample.deleteMany();
    await prisma.labTest.deleteMany();
    await prisma.labQualityControl.deleteMany();
    await prisma.labReagent.deleteMany();
    await prisma.labEquipment.deleteMany();
    await prisma.labTestCatalog.deleteMany();
    await prisma.lisIntegration.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.medication.deleteMany();
    await prisma.bloodDonation.deleteMany();
    await prisma.radiologyTest.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.pharmacist.deleteMany();
    await prisma.labTechnician.deleteMany();
    await prisma.receptionist.deleteMany();
    await prisma.nurse.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();
  }

  console.log('👥 Creating users...');

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@hms.com',
      password: await hashPassword('Admin123!'),
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      role: 'SUPERADMIN',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.admin.create({
    data: {
      userId: superAdmin.id,
      department: 'IT Administration',
      permissions: ['ALL'],
    },
  });

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hms.com',
      password: await hashPassword('Admin123!'),
      firstName: 'Hospital',
      lastName: 'Administrator',
      phone: '+1234567891',
      role: 'ADMIN',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.admin.create({
    data: {
      userId: admin.id,
      department: 'Hospital Administration',
      permissions: ['USER_MANAGEMENT', 'REPORTS', 'BILLING'],
    },
  });

  // Create Doctors
  const doctor1 = await prisma.user.create({
    data: {
      email: 'dr.smith@hms.com',
      password: await hashPassword('Doctor123!'),
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567892',
      role: 'DOCTOR',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.doctor.create({
    data: {
      userId: doctor1.id,
      licenseNumber: 'MD123456',
      specialization: 'Cardiology',
      department: 'Cardiology',
      experienceYears: 15,
      qualifications: ['MD - Cardiology', 'FACC'],
      schedule: {
        monday: ['09:00-12:00', '14:00-17:00'],
        tuesday: ['09:00-12:00', '14:00-17:00'],
        wednesday: ['09:00-12:00'],
        thursday: ['09:00-12:00', '14:00-17:00'],
        friday: ['09:00-12:00'],
      },
      isAvailable: true,
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      email: 'dr.johnson@hms.com',
      password: await hashPassword('Doctor123!'),
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567893',
      role: 'DOCTOR',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.doctor.create({
    data: {
      userId: doctor2.id,
      licenseNumber: 'MD789012',
      specialization: 'Pediatrics',
      department: 'Pediatrics',
      experienceYears: 8,
      qualifications: ['MD - Pediatrics', 'FAAP'],
      schedule: {
        monday: ['08:00-13:00'],
        tuesday: ['08:00-13:00'],
        wednesday: ['08:00-13:00'],
        thursday: ['08:00-13:00'],
        friday: ['08:00-13:00'],
      },
      isAvailable: true,
    },
  });

  // Create Nurse
  const nurse = await prisma.user.create({
    data: {
      email: 'nurse.williams@hms.com',
      password: await hashPassword('Nurse123!'),
      firstName: 'Emily',
      lastName: 'Williams',
      phone: '+1234567894',
      role: 'NURSE',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.nurse.create({
    data: {
      userId: nurse.id,
      licenseNumber: 'RN456789',
      department: 'Emergency',
      shift: 'MORNING',
    },
  });

  // Create Receptionist
  const receptionist = await prisma.user.create({
    data: {
      email: 'reception@hms.com',
      password: await hashPassword('Reception123!'),
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1234567895',
      role: 'RECEPTIONIST',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.receptionist.create({
    data: {
      userId: receptionist.id,
      department: 'Front Desk',
    },
  });

  // Create Lab Technician
  const labTech = await prisma.user.create({
    data: {
      email: 'labtech@hms.com',
      password: await hashPassword('Lab123!'),
      firstName: 'David',
      lastName: 'Brown',
      phone: '+1234567896',
      role: 'LAB_TECHNICIAN',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.labTechnician.create({
    data: {
      userId: labTech.id,
      licenseNumber: 'MLT987654',
      specialties: ['Hematology', 'Clinical Chemistry'],
    },
  });

  // Create Pharmacist
  const pharmacist = await prisma.user.create({
    data: {
      email: 'pharmacy@hms.com',
      password: await hashPassword('Pharma123!'),
      firstName: 'Lisa',
      lastName: 'Anderson',
      phone: '+1234567897',
      role: 'PHARMACIST',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.pharmacist.create({
    data: {
      userId: pharmacist.id,
      licenseNumber: 'RP123456',
    },
  });

  // Create Patients
  console.log('👥 Creating patients...');

  const patient1 = await prisma.user.create({
    data: {
      email: 'patient.doe@hms.com',
      password: await hashPassword('Patient123!'),
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567898',
      role: 'PATIENT',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.patient.create({
    data: {
      userId: patient1.id,
      mrn: 'MRN2024001',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'MALE',
      bloodType: 'O_POSITIVE',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1234567899',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      insuranceInfo: {
        provider: 'Blue Cross',
        policyNumber: 'BC123456789',
        groupNumber: 'GRP987654',
        validUntil: '2025-12-31'
      },
      allergies: ['Penicillin', 'Shellfish'],
      currentMedications: ['Lisinopril 10mg', 'Atorvastatin 20mg'],
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'patient.smith@hms.com',
      password: await hashPassword('Patient123!'),
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '+1234567900',
      role: 'PATIENT',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  await prisma.patient.create({
    data: {
      userId: patient2.id,
      mrn: 'MRN2024002',
      dateOfBirth: new Date('1992-08-22'),
      gender: 'FEMALE',
      bloodType: 'A_NEGATIVE',
      emergencyContact: 'Bob Smith',
      emergencyPhone: '+1234567901',
      address: {
        street: '456 Oak Ave',
        city: 'Somewhere',
        state: 'NY',
        zipCode: '67890',
        country: 'USA'
      },
      insuranceInfo: {
        provider: 'Aetna',
        policyNumber: 'AE987654321',
        groupNumber: 'GRP123456',
        validUntil: '2025-06-30'
      },
      allergies: ['Latex'],
      currentMedications: ['Ibuprofen 400mg'],
    },
  });

  // Create Lab Test Catalog
  console.log('🧪 Creating lab test catalog...');

  const labTests = [
    {
      testCode: 'CBC',
      testName: 'Complete Blood Count',
      category: 'Hematology',
      department: 'HEMATOLOGY',
      specimenType: 'BLOOD',
      containerType: 'EDTA Tube',
      volumeRequired: '3ml',
      specialInstructions: 'Fasting not required',
      turnaroundTime: 1,
      referenceRange: { adult: 'Normal ranges vary by age and sex' },
      units: 'cells/μL',
      method: 'Automated hematology analyzer',
      cost: 25.00,
      requiresApproval: false,
    },
    {
      testCode: 'BMP',
      testName: 'Basic Metabolic Panel',
      category: 'Chemistry',
      department: 'CHEMISTRY',
      specimenType: 'BLOOD',
      containerType: 'Serum Separator Tube',
      volumeRequired: '5ml',
      specialInstructions: 'Fasting required for 8-12 hours',
      turnaroundTime: 2,
      referenceRange: { glucose: '70-100 mg/dL', sodium: '135-145 mmol/L' },
      units: 'mg/dL',
      method: 'Chemistry analyzer',
      cost: 35.00,
      requiresApproval: false,
    },
    {
      testCode: 'LIPID',
      testName: 'Lipid Panel',
      category: 'Chemistry',
      department: 'CHEMISTRY',
      specimenType: 'BLOOD',
      containerType: 'Serum Separator Tube',
      volumeRequired: '5ml',
      specialInstructions: 'Fasting required for 9-12 hours',
      turnaroundTime: 2,
      referenceRange: { cholesterol: '<200 mg/dL', triglycerides: '<150 mg/dL' },
      units: 'mg/dL',
      method: 'Chemistry analyzer',
      cost: 45.00,
      requiresApproval: false,
    },
    {
      testCode: 'HBA1C',
      testName: 'Hemoglobin A1c',
      category: 'Chemistry',
      department: 'CHEMISTRY',
      specimenType: 'BLOOD',
      containerType: 'EDTA Tube',
      volumeRequired: '3ml',
      specialInstructions: 'No fasting required',
      turnaroundTime: 1,
      referenceRange: { normal: '4.0-5.6%', diabetic: '>6.5%' },
      units: '%',
      method: 'HPLC',
      cost: 30.00,
      requiresApproval: false,
    },
    {
      testCode: 'URINE',
      testName: 'Urinalysis',
      category: 'General',
      department: 'CHEMISTRY',
      specimenType: 'URINE',
      containerType: 'Sterile Container',
      volumeRequired: '10ml',
      specialInstructions: 'Clean catch midstream',
      turnaroundTime: 1,
      referenceRange: { color: 'Yellow/amber', ph: '4.5-8.0' },
      units: 'various',
      method: 'Dipstick and microscopy',
      cost: 15.00,
      requiresApproval: false,
    },
  ];

  for (const test of labTests) {
    await prisma.labTestCatalog.create({
      data: test,
    });
  }

  // Create Medications
  console.log('💊 Creating medications...');

  const medications = [
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      brandName: 'Zestril',
      dosageForm: 'TABLET',
      strength: '10mg',
      manufacturer: 'Pfizer',
      stockQuantity: 500,
      reorderLevel: 50,
      unitPrice: 0.15,
      category: 'Antihypertensive',
      requiresPrescription: true,
    },
    {
      name: 'Atorvastatin',
      genericName: 'Atorvastatin Calcium',
      brandName: 'Lipitor',
      dosageForm: 'TABLET',
      strength: '20mg',
      manufacturer: 'Pfizer',
      stockQuantity: 300,
      reorderLevel: 30,
      unitPrice: 0.25,
      category: 'Statin',
      requiresPrescription: true,
    },
    {
      name: 'Metformin',
      genericName: 'Metformin Hydrochloride',
      brandName: 'Glucophage',
      dosageForm: 'TABLET',
      strength: '500mg',
      manufacturer: 'Bristol-Myers Squibb',
      stockQuantity: 1000,
      reorderLevel: 100,
      unitPrice: 0.10,
      category: 'Antidiabetic',
      requiresPrescription: true,
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      brandName: 'Advil',
      dosageForm: 'TABLET',
      strength: '400mg',
      manufacturer: 'Pfizer',
      stockQuantity: 800,
      reorderLevel: 100,
      unitPrice: 0.08,
      category: 'NSAID',
      requiresPrescription: false,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      dosageForm: 'CAPSULE',
      strength: '500mg',
      manufacturer: 'GlaxoSmithKline',
      stockQuantity: 200,
      reorderLevel: 50,
      unitPrice: 0.20,
      category: 'Antibiotic',
      requiresPrescription: true,
    },
  ];

  for (const medication of medications) {
    await prisma.medication.create({
      data: medication,
    });
  }

  // Create Appointments
  console.log('📅 Creating appointments...');

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: (await prisma.patient.findFirst({ where: { mrn: 'MRN2024001' } }))!.id,
      doctorId: doctor1.id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      reason: 'Regular checkup',
      roomNumber: 'Consultation Room 1',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: (await prisma.patient.findFirst({ where: { mrn: 'MRN2024002' } }))!.id,
      doctorId: doctor2.id,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      duration: 30,
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      reason: 'Fever and cough',
      roomNumber: 'Consultation Room 2',
    },
  });

  // Create Sample Lab Tests
  console.log('🧪 Creating lab tests...');

  const labTest1 = await prisma.labTest.create({
    data: {
      patientId: (await prisma.patient.findFirst({ where: { mrn: 'MRN2024001' } }))!.id,
      testCatalogId: (await prisma.labTestCatalog.findFirst({ where: { testCode: 'CBC' } }))!.id,
      orderNumber: 'LAB-2024-001',
      status: 'ORDERED',
      priority: 'ROUTINE',
      orderedBy: doctor1.id,
      clinicalInfo: 'Routine checkup',
      diagnosis: 'Hypertension',
      urgent: false,
    },
  });

  const labTest2 = await prisma.labTest.create({
    data: {
      patientId: (await prisma.patient.findFirst({ where: { mrn: 'MRN2024002' } }))!.id,
      testCatalogId: (await prisma.labTestCatalog.findFirst({ where: { testCode: 'BMP' } }))!.id,
      orderNumber: 'LAB-2024-002',
      status: 'ORDERED',
      priority: 'ROUTINE',
      orderedBy: doctor2.id,
      clinicalInfo: 'Fever evaluation',
      diagnosis: 'Fever of unknown origin',
      urgent: false,
    },
  });

  // Create Compliance Checks
  console.log('📋 Creating compliance checks...');

  const complianceChecks = [
    {
      checkId: 'hipaa-encryption',
      name: 'HIPAA Encryption Compliance',
      description: 'Verify that all patient data is encrypted at rest and in transit',
      category: 'HIPAA',
      status: 'PASS',
      severity: 'HIGH',
      details: 'All database connections use SSL/TLS encryption. Data at rest is encrypted.',
      recommendations: ['Continue monitoring encryption protocols', 'Update SSL certificates annually'],
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      checkId: 'gdpr-consent',
      name: 'GDPR Consent Management',
      description: 'Verify patient consent mechanisms are in place and functioning',
      category: 'GDPR',
      status: 'WARNING',
      severity: 'MEDIUM',
      details: 'Consent management system is partially implemented. Need to add automatic expiration.',
      recommendations: ['Implement automatic consent expiration', 'Add consent withdrawal process'],
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      checkId: 'access-control',
      name: 'Access Control Audit',
      description: 'Verify role-based access control is properly implemented',
      category: 'GENERAL',
      status: 'PASS',
      severity: 'HIGH',
      details: 'RBAC is properly implemented with role hierarchies and permissions.',
      recommendations: ['Regular permission reviews', 'Implement least privilege principle'],
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  ];

  for (const check of complianceChecks) {
    await prisma.complianceCheck.create({
      data: check,
    });
  }

  // Create Sample Audit Logs
  console.log('📝 Creating audit logs...');

  const auditLogs = [
    {
      userId: superAdmin.id,
      action: 'USER_CREATED',
      resource: 'users',
      resourceId: admin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Database Seed)',
      details: { action: 'Created admin user', targetUser: admin.email },
      complianceFlags: ['HIPAA', 'USER_MANAGEMENT'],
      success: true,
    },
    {
      userId: doctor1.id,
      action: 'PATIENT_RECORD_ACCESSED',
      resource: 'patients',
      resourceId: (await prisma.patient.findFirst({ where: { mrn: 'MRN2024001' } }))!.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Database Seed)',
      details: { action: 'Viewed patient record', patientMRN: 'MRN2024001' },
      complianceFlags: ['HIPAA', 'PHI_ACCESS'],
      success: true,
    },
    {
      userId: receptionist.id,
      action: 'APPOINTMENT_CREATED',
      resource: 'appointments',
      resourceId: appointment1.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Database Seed)',
      details: { action: 'Created new appointment', appointmentType: 'CONSULTATION' },
      complianceFlags: ['AUDIT'],
      success: true,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  // Create Sample Operating Theaters
  console.log('🏥 Creating operating theaters...');

  const operatingTheaters = [
    {
      name: 'OT-1 - General Surgery',
      location: '2nd Floor, West Wing',
      type: 'GENERAL',
      capacity: 1,
      equipment: ['Anesthesia machine', 'Surgical lights', 'Operating table', 'Monitoring equipment'],
    },
    {
      name: 'OT-2 - Cardiac Surgery',
      location: '2nd Floor, East Wing',
      type: 'CARDIAC',
      capacity: 1,
      equipment: ['Heart-lung machine', 'Anesthesia machine', 'Surgical lights', 'Operating table'],
    },
    {
      name: 'OT-3 - Orthopedic Surgery',
      location: '3rd Floor, West Wing',
      type: 'ORTHOPEDIC',
      capacity: 1,
      equipment: ['C-arm X-ray', 'Anesthesia machine', 'Surgical lights', 'Operating table'],
    },
  ];

  for (const theater of operatingTheaters) {
    await prisma.operatingTheater.create({
      data: theater,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`  - Users: ${await prisma.user.count()}`);
  console.log(`  - Patients: ${await prisma.patient.count()}`);
  console.log(`  - Doctors: ${await prisma.doctor.count()}`);
  console.log(`  - Lab Tests: ${await prisma.labTest.count()}`);
  console.log(`  - Medications: ${await prisma.medication.count()}`);
  console.log(`  - Appointments: ${await prisma.appointment.count()}`);
  console.log(`  - Compliance Checks: ${await prisma.complianceCheck.count()}`);
  console.log(`  - Audit Logs: ${await prisma.auditLog.count()}`);
  console.log(`  - Operating Theaters: ${await prisma.operatingTheater.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });