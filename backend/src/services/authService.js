const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// Generates next patient identifier (e.g., CP-2026-0001)
async function generatePatientIdentifier() {
  const count = await prisma.patient.count();
  const year = new Date().getFullYear();
  const nextNum = String(count + 1).padStart(4, '0');
  return `CP-${year}-${nextNum}`;
}

/**
 * Universal Unified Registration for ALL roles: PATIENT, DOCTOR, NURSE, RECEPTIONIST, ADMIN
 */
async function registerUser({ name, email, password, role = 'PATIENT', phone, gender, specialty, qualification, consultationFee }) {
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const validRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'];
  const assignedRole = role ? role.toUpperCase().trim() : 'PATIENT';
  if (!validRoles.includes(assignedRole)) {
    throw new AppError(`Invalid role. Permitted: ${validRoles.join(', ')}`, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new AppError('An account with this email address already exists. Please log in.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Retrieve default branch for staff assignment
  const defaultBranch = await prisma.hospitalBranch.findFirst({
    where: { isActive: true },
  });

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        accountStatus: 'ACTIVE',
      },
    });

    if (assignedRole === 'PATIENT') {
      const patientIdentifier = await generatePatientIdentifier();
      const patient = await tx.patient.create({
        data: {
          userId: newUser.id,
          patientIdentifier,
          phone: phone || null,
          gender: gender || null,
        },
      });
      return { ...newUser, patient };
    } else if (assignedRole === 'DOCTOR') {
      const doctor = await tx.doctor.create({
        data: {
          userId: newUser.id,
          specialty: specialty || 'General Medicine',
          qualification: qualification || 'MBBS',
          consultationFee: consultationFee ? parseFloat(consultationFee) : 600.0,
          isActive: true,
        },
      });
      if (defaultBranch) {
        await tx.staffBranchAssignment.create({
          data: {
            userId: newUser.id,
            branchId: defaultBranch.id,
            isActive: true,
          },
        });
      }
      return { ...newUser, doctor };
    } else if (assignedRole === 'NURSE') {
      const nurseCount = await tx.nurse.count();
      const nurse = await tx.nurse.create({
        data: {
          userId: newUser.id,
          staffIdentifier: `NUR-${String(nurseCount + 1).padStart(3, '0')}`,
        },
      });
      if (defaultBranch) {
        await tx.staffBranchAssignment.create({
          data: {
            userId: newUser.id,
            branchId: defaultBranch.id,
            isActive: true,
          },
        });
      }
      return { ...newUser, nurse };
    } else if (assignedRole === 'RECEPTIONIST') {
      const recCount = await tx.receptionist.count();
      const receptionist = await tx.receptionist.create({
        data: {
          userId: newUser.id,
          staffIdentifier: `REC-${String(recCount + 1).padStart(3, '0')}`,
          deskLabel: 'Main Outpatient Intake Desk',
        },
      });
      if (defaultBranch) {
        await tx.staffBranchAssignment.create({
          data: {
            userId: newUser.id,
            branchId: defaultBranch.id,
            isActive: true,
          },
        });
      }
      return { ...newUser, receptionist };
    } else if (assignedRole === 'ADMIN') {
      return newUser;
    }

    return newUser;
  });

  await logAudit({
    actorUserId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    metadata: { role: assignedRole },
  });

  const token = generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient || null,
      doctor: user.doctor || null,
      nurse: user.nurse || null,
      receptionist: user.receptionist || null,
    },
  };
}

/**
 * Universal Login for ALL roles with role dropdown verification
 */
async function login({ email, password, role }) {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      patient: true,
      doctor: true,
      nurse: true,
      receptionist: true,
      branchAssignments: {
        where: { isActive: true },
        include: { branch: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password credentials', 401);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new AppError('Your account is currently inactive. Please contact administration.', 403);
  }

  // If client specifies an expected role from the dropdown, verify role matches
  if (role && user.role !== role.toUpperCase().trim()) {
    throw new AppError(
      `Role mismatch: This account is registered as '${user.role}'. Please select '${user.role}' in the role dropdown.`,
      403
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password credentials', 401);
  }

  const token = generateToken(user.id, user.role);

  await logAudit({
    actorUserId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    metadata: { role: user.role },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
      doctor: user.doctor,
      nurse: user.nurse,
      receptionist: user.receptionist,
      branchAssignments: user.branchAssignments,
    },
  };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: true,
      doctor: true,
      nurse: true,
      receptionist: true,
      branchAssignments: {
        where: { isActive: true },
        include: { branch: true },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  registerUser,
  registerPatient: registerUser, // backward compatibility
  login,
  getCurrentUser,
  generatePatientIdentifier,
};
