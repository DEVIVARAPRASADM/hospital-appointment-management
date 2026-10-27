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

async function registerPatient({ name, email, password, phone, gender }) {
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const patientIdentifier = await generatePatientIdentifier();

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'PATIENT',
        accountStatus: 'ACTIVE',
      },
    });

    const newPatient = await tx.patient.create({
      data: {
        userId: newUser.id,
        patientIdentifier,
        phone: phone || null,
        gender: gender || null,
      },
    });

    return { ...newUser, patient: newPatient };
  });

  await logAudit({
    actorUserId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    metadata: { role: 'PATIENT', patientIdentifier },
  });

  const token = generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
    },
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
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
  registerPatient,
  login,
  getCurrentUser,
  generatePatientIdentifier,
};
