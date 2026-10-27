const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CarePoint Hospital Database...');

  // Clean existing operational data safely in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.triageRecord.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.doctorSession.deleteMany();
  await prisma.staffBranchAssignment.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospitalLocation.deleteMany();
  await prisma.hospitalBranch.deleteMany();
  await prisma.hospital.deleteMany();

  // 1. Seed Hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'CarePoint Super Specialty Hospital',
      slug: 'carepoint-super-specialty',
      hospitalType: 'Multispecialty Tertiary Care',
      description: 'Premier outpatient care and multi-specialty clinical excellence.',
      email: 'info@carepointhospital.com',
      phone: '+91 40 2345 6789',
      websiteUrl: 'https://carepointhospital.com',
      isActive: true,
    },
  });

  // 2. Seed Hospital Branches & Locations
  const branchJubilee = await prisma.hospitalBranch.create({
    data: {
      hospitalId: hospital.id,
      name: 'Jubilee Hills Main Campus',
      branchCode: 'JBL-01',
      phone: '+91 40 2345 6780',
      email: 'jubilee@carepointhospital.com',
      isActive: true,
      location: {
        create: {
          addressLine1: 'Road No. 36, Jubilee Hills',
          landmark: 'Near Metro Station',
          areaOrLocality: 'Jubilee Hills',
          city: 'Hyderabad',
          district: 'Hyderabad',
          stateOrRegion: 'Telangana',
          postalCode: '500033',
          country: 'India',
          latitude: 17.4319,
          longitude: 78.4074,
        },
      },
    },
  });

  const branchBanjara = await prisma.hospitalBranch.create({
    data: {
      hospitalId: hospital.id,
      name: 'Banjara Hills Outpatient Wing',
      branchCode: 'BNJ-02',
      phone: '+91 40 2345 6781',
      email: 'banjara@carepointhospital.com',
      isActive: true,
      location: {
        create: {
          addressLine1: 'Road No. 12, Banjara Hills',
          landmark: 'Opposite Park Hyatt',
          city: 'Hyderabad',
          district: 'Hyderabad',
          stateOrRegion: 'Telangana',
          postalCode: '500034',
          country: 'India',
          latitude: 17.4156,
          longitude: 78.4354,
        },
      },
    },
  });

  // 3. Seed Departments
  const deptCardio = await prisma.department.create({
    data: {
      hospitalId: hospital.id,
      name: 'Cardiology',
      description: 'Comprehensive adult and pediatric cardiovascular medicine.',
    },
  });

  const deptNeuro = await prisma.department.create({
    data: {
      hospitalId: hospital.id,
      name: 'Neurology',
      description: 'Advanced neurological disorders and stroke care.',
    },
  });

  const deptOrtho = await prisma.department.create({
    data: {
      hospitalId: hospital.id,
      name: 'Orthopedics',
      description: 'Joint replacement, trauma care, and sports medicine.',
    },
  });

  const deptGeneral = await prisma.department.create({
    data: {
      hospitalId: hospital.id,
      name: 'General Medicine',
      description: 'Internal medicine, health checks, and chronic disease management.',
    },
  });

  // Default demo password: Password@123
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 4. Seed Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'Vikram Mehta (Admin)',
      email: 'admin@carepoint.com',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    },
  });

  // 5. Seed Receptionist User
  const recUser = await prisma.user.create({
    data: {
      name: 'Priya Sharma (Reception)',
      email: 'reception@carepoint.com',
      passwordHash,
      role: 'RECEPTIONIST',
      accountStatus: 'ACTIVE',
      receptionist: {
        create: {
          staffIdentifier: 'REC-001',
          deskLabel: 'Main Outpatient Intake Desk 1',
        },
      },
      branchAssignments: {
        create: {
          branchId: branchJubilee.id,
          isActive: true,
        },
      },
    },
  });

  // 6. Seed Nurse User
  const nurseUser = await prisma.user.create({
    data: {
      name: 'Anjali Nair (Nurse)',
      email: 'nurse@carepoint.com',
      passwordHash,
      role: 'NURSE',
      accountStatus: 'ACTIVE',
      nurse: {
        create: {
          staffIdentifier: 'NUR-001',
        },
      },
      branchAssignments: {
        create: {
          branchId: branchJubilee.id,
          isActive: true,
        },
      },
    },
  });

  // 7. Seed Doctors
  const doc1User = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Rao',
      email: 'doctor.rao@carepoint.com',
      passwordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      doctor: {
        create: {
          specialty: 'Cardiology',
          qualification: 'MBBS, MD (Cardiology), DM',
          consultationFee: 850.0,
          isActive: true,
        },
      },
      branchAssignments: {
        create: {
          branchId: branchJubilee.id,
          isActive: true,
        },
      },
    },
    include: { doctor: true },
  });

  const doc2User = await prisma.user.create({
    data: {
      name: 'Dr. Sunita Deshmukh',
      email: 'doctor.deshmukh@carepoint.com',
      passwordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      doctor: {
        create: {
          specialty: 'Neurology',
          qualification: 'MBBS, MD, DM (Neurology)',
          consultationFee: 900.0,
          isActive: true,
        },
      },
      branchAssignments: {
        create: {
          branchId: branchJubilee.id,
          isActive: true,
        },
      },
    },
    include: { doctor: true },
  });

  const doc3User = await prisma.user.create({
    data: {
      name: 'Dr. Arun Varma',
      email: 'doctor.varma@carepoint.com',
      passwordHash,
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      doctor: {
        create: {
          specialty: 'Orthopedics',
          qualification: 'MBBS, MS (Ortho), MCh',
          consultationFee: 750.0,
          isActive: true,
        },
      },
      branchAssignments: {
        create: {
          branchId: branchBanjara.id,
          isActive: true,
        },
      },
    },
    include: { doctor: true },
  });

  // 8. Seed Patient Users
  const patient1User = await prisma.user.create({
    data: {
      name: 'Kavita Reddy',
      email: 'patient@carepoint.com',
      passwordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      patient: {
        create: {
          patientIdentifier: 'CP-2026-0001',
          phone: '+91 98765 43210',
          gender: 'FEMALE',
        },
      },
    },
    include: { patient: true },
  });

  const patient2User = await prisma.user.create({
    data: {
      name: 'Ramesh Gupta',
      email: 'ramesh.gupta@carepoint.com',
      passwordHash,
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      patient: {
        create: {
          patientIdentifier: 'CP-2026-0002',
          phone: '+91 98450 12345',
          gender: 'MALE',
        },
      },
    },
    include: { patient: true },
  });

  // 9. Seed Today's and Tomorrow's Sessions & Discrete Availability Slots
  const now = new Date();
  const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const sessionEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

  const session1 = await prisma.doctorSession.create({
    data: {
      doctorId: doc1User.doctor.id,
      branchId: branchJubilee.id,
      departmentId: deptCardio.id,
      startTime: sessionStart,
      endTime: sessionEnd,
      status: 'ACTIVE',
      delayMinutes: 10,
      delayReason: 'Emergency patient review in ICU',
      delayUpdatedAt: new Date(),
    },
  });

  // Future slots for Doctor Rao (tomorrow at 10 AM, 10:30 AM, etc.)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sessionTomorrow = await prisma.doctorSession.create({
    data: {
      doctorId: doc1User.doctor.id,
      branchId: branchJubilee.id,
      departmentId: deptCardio.id,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0, 0),
      status: 'SCHEDULED',
    },
  });

  const createdSlots = [];
  // Today's slots
  for (let h = 9; h < 20; h++) {
    for (const m of [0, 30]) {
      const sStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const sEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), m === 0 ? h : h + 1, m === 0 ? 30 : 0);
      const slot = await prisma.availability.create({
        data: {
          doctorId: doc1User.doctor.id,
          sessionId: session1.id,
          startTime: sStart,
          endTime: sEnd,
          status: 'OPEN',
        },
      });
      createdSlots.push(slot);
    }
  }

  // Tomorrow's slots
  for (let h = 9; h < 17; h++) {
    for (const m of [0, 30]) {
      const sStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), h, m);
      const sEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), m === 0 ? h : h + 1, m === 0 ? 30 : 0);
      await prisma.availability.create({
        data: {
          doctorId: doc1User.doctor.id,
          sessionId: sessionTomorrow.id,
          startTime: sStart,
          endTime: sEnd,
          status: 'OPEN',
        },
      });
    }
  }

  // Session for Doctor Deshmukh (Neurology)
  const session2 = await prisma.doctorSession.create({
    data: {
      doctorId: doc2User.doctor.id,
      branchId: branchJubilee.id,
      departmentId: deptNeuro.id,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0),
      status: 'SCHEDULED',
    },
  });

  for (let h = 14; h < 18; h++) {
    for (const m of [0, 30]) {
      await prisma.availability.create({
        data: {
          doctorId: doc2User.doctor.id,
          sessionId: session2.id,
          startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m),
          endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), m === 0 ? h : h + 1, m === 0 ? 30 : 0),
          status: 'OPEN',
        },
      });
    }
  }

  // 10. Seed Appointments (Confirmed & Cancelled for History)
  const appt1 = await prisma.appointment.create({
    data: {
      bookingReference: 'BK-CRD101',
      patientId: patient1User.patient.id,
      availabilityId: createdSlots[0].id,
      reason: 'Routine cardiac health review and palpitations',
      status: 'CONFIRMED',
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      bookingReference: 'BK-CRD102',
      patientId: patient2User.patient.id,
      availabilityId: createdSlots[1].id,
      reason: 'Chest heaviness on stairs',
      status: 'CONFIRMED',
    },
  });

  // Seed a cancelled appointment for slot 3 to demonstrate history preservation
  await prisma.appointment.create({
    data: {
      bookingReference: 'BK-CAN999',
      patientId: patient2User.patient.id,
      availabilityId: createdSlots[2].id,
      reason: 'Schedule conflict',
      status: 'CANCELLED',
      cancellationReason: 'Patient had travel clash',
    },
  });

  // 11. Seed Visits, Tokens, and Queue
  // Visit 1: Appt1 checked in and waiting in queue
  const visit1 = await prisma.visit.create({
    data: {
      appointmentId: appt1.id,
      patientId: patient1User.patient.id,
      sessionId: session1.id,
      visitType: 'APPOINTMENT',
      tokenNumber: 1,
      queueSequence: 1,
      status: 'WAITING',
      checkedInAt: new Date(now.getTime() - 25 * 60000),
      registeredByUserId: recUser.id,
    },
  });

  // Visit 2: Walk-in patient registered directly at reception
  const visit2 = await prisma.visit.create({
    data: {
      patientId: patient2User.patient.id,
      sessionId: session1.id,
      visitType: 'WALK_IN',
      tokenNumber: 2,
      queueSequence: 2,
      status: 'WAITING',
      checkedInAt: new Date(now.getTime() - 15 * 60000),
      registeredByUserId: recUser.id,
    },
  });

  // 12. Seed Triage Record for Visit 1 by Nurse
  const nurseProfile = await prisma.nurse.findUnique({ where: { userId: nurseUser.id } });
  await prisma.triageRecord.create({
    data: {
      visitId: visit1.id,
      nurseId: nurseProfile.id,
      bloodPressure: '128/82 mmHg',
      temperature: 98.4,
      pulseRate: 74,
      oxygenSaturation: 99.0,
      notes: 'Patient alert, resting pulse normal, no acute respiratory distress.',
    },
  });

  console.log('✅ CarePoint Hospital Database seeded successfully!');
  console.log('\nDemo User Accounts (Password for all: Password@123):');
  console.log('  - Admin:        admin@carepoint.com');
  console.log('  - Receptionist: reception@carepoint.com');
  console.log('  - Doctor:       doctor.rao@carepoint.com');
  console.log('  - Nurse:        nurse@carepoint.com');
  console.log('  - Patient:      patient@carepoint.com');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
