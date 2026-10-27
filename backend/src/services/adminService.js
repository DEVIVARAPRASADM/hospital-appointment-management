const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

async function getAdminDashboardStats() {
  const totalHospitals = await prisma.hospital.count({ where: { isActive: true } });
  const totalBranches = await prisma.hospitalBranch.count({ where: { isActive: true } });
  const totalDoctors = await prisma.doctor.count({ where: { isActive: true } });
  const totalPatients = await prisma.patient.count();
  const totalAppointments = await prisma.appointment.count();
  const confirmedAppointments = await prisma.appointment.count({ where: { status: 'CONFIRMED' } });
  const completedAppointments = await prisma.appointment.count({ where: { status: 'COMPLETED' } });
  const cancelledAppointments = await prisma.appointment.count({ where: { status: 'CANCELLED' } });
  const totalVisits = await prisma.visit.count();
  const walkInVisits = await prisma.visit.count({ where: { visitType: 'WALK_IN' } });

  const recentAuditLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      actorUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return {
    hospitals: totalHospitals,
    branches: totalBranches,
    doctors: totalDoctors,
    patients: totalPatients,
    appointments: {
      total: totalAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
    },
    visits: {
      total: totalVisits,
      walkIns: walkInVisits,
      scheduled: totalVisits - walkInVisits,
    },
    recentAuditLogs,
  };
}

async function createStaffUser({ name, email, password, role, branchId, staffDetails = {} }, actorUserId) {
  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    throw new AppError('A user with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        accountStatus: 'ACTIVE',
      },
    });

    if (role === 'DOCTOR') {
      const { specialty = 'General Medicine', qualification = 'MBBS', consultationFee = 500 } = staffDetails;
      await tx.doctor.create({
        data: {
          userId: user.id,
          specialty,
          qualification,
          consultationFee,
        },
      });
    } else if (role === 'NURSE') {
      const count = await tx.nurse.count();
      await tx.nurse.create({
        data: {
          userId: user.id,
          staffIdentifier: `NUR-${String(count + 1).padStart(3, '0')}`,
        },
      });
    } else if (role === 'RECEPTIONIST') {
      const count = await tx.receptionist.count();
      await tx.receptionist.create({
        data: {
          userId: user.id,
          staffIdentifier: `REC-${String(count + 1).padStart(3, '0')}`,
          deskLabel: staffDetails.deskLabel || 'Main Intake Desk',
        },
      });
    }

    if (branchId) {
      await tx.staffBranchAssignment.create({
        data: {
          userId: user.id,
          branchId,
          isActive: true,
        },
      });
    }

    await logAudit({
      actorUserId,
      action: 'CREATE_STAFF_MEMBER',
      entityType: 'User',
      entityId: user.id,
      metadata: { role, branchId },
    });

    return tx.user.findUnique({
      where: { id: user.id },
      include: {
        doctor: true,
        nurse: true,
        receptionist: true,
        branchAssignments: { include: { branch: true } },
      },
    });
  });
}

async function getAllStaff() {
  return prisma.user.findMany({
    where: { role: { not: 'PATIENT' } },
    include: {
      doctor: true,
      nurse: true,
      receptionist: true,
      branchAssignments: { include: { branch: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  getAdminDashboardStats,
  createStaffUser,
  getAllStaff,
};
