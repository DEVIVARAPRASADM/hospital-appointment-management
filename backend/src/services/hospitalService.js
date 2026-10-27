const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

async function getAllHospitals() {
  return prisma.hospital.findMany({
    where: { isActive: true },
    include: {
      branches: {
        where: { isActive: true },
        include: { location: true },
      },
      departments: {
        where: { isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

async function getHospitalById(id) {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      branches: {
        where: { isActive: true },
        include: { location: true },
      },
      departments: {
        where: { isActive: true },
      },
    },
  });
  if (!hospital) {
    throw new AppError('Hospital not found', 404);
  }
  return hospital;
}

async function getHospitalBranches(hospitalId) {
  return prisma.hospitalBranch.findMany({
    where: { hospitalId, isActive: true },
    include: { location: true },
    orderBy: { name: 'asc' },
  });
}

async function getBranchById(id) {
  const branch = await prisma.hospitalBranch.findUnique({
    where: { id },
    include: {
      hospital: true,
      location: true,
    },
  });
  if (!branch) {
    throw new AppError('Hospital branch not found', 404);
  }
  return branch;
}

async function getBranchLocation(branchId) {
  const location = await prisma.hospitalLocation.findUnique({
    where: { branchId },
  });
  if (!location) {
    throw new AppError('Branch location details not found', 404);
  }
  return location;
}

async function createHospital(data, actorUserId) {
  const { name, slug, hospitalType, description, email, phone, websiteUrl } = data;
  if (!name || !slug) {
    throw new AppError('Hospital name and slug are required', 400);
  }

  const hospital = await prisma.hospital.create({
    data: {
      name,
      slug: slug.toLowerCase().trim(),
      hospitalType,
      description,
      email,
      phone,
      websiteUrl,
    },
  });

  await logAudit({
    actorUserId,
    action: 'CREATE_HOSPITAL',
    entityType: 'Hospital',
    entityId: hospital.id,
    metadata: { name, slug },
  });

  return hospital;
}

async function createBranch(hospitalId, data, actorUserId) {
  const { name, branchCode, phone, email, location } = data;
  if (!name) {
    throw new AppError('Branch name is required', 400);
  }

  const branch = await prisma.$transaction(async (tx) => {
    const newBranch = await tx.hospitalBranch.create({
      data: {
        hospitalId,
        name,
        branchCode,
        phone,
        email,
      },
    });

    if (location) {
      await tx.hospitalLocation.create({
        data: {
          branchId: newBranch.id,
          addressLine1: location.addressLine1 || 'Main Campus Road',
          addressLine2: location.addressLine2,
          landmark: location.landmark,
          areaOrLocality: location.areaOrLocality,
          city: location.city || 'Hyderabad',
          district: location.district,
          stateOrRegion: location.stateOrRegion || 'Telangana',
          postalCode: location.postalCode,
          country: location.country || 'India',
          latitude: location.latitude ? parseFloat(location.latitude) : null,
          longitude: location.longitude ? parseFloat(location.longitude) : null,
        },
      });
    }

    return tx.hospitalBranch.findUnique({
      where: { id: newBranch.id },
      include: { location: true },
    });
  });

  await logAudit({
    actorUserId,
    action: 'CREATE_BRANCH',
    entityType: 'HospitalBranch',
    entityId: branch.id,
    metadata: { hospitalId, name },
  });

  return branch;
}

async function getAllDepartments(hospitalId) {
  const where = { isActive: true };
  if (hospitalId) {
    where.hospitalId = hospitalId;
  }
  return prisma.department.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

async function createDepartment(hospitalId, data, actorUserId) {
  const { name, description } = data;
  if (!name) {
    throw new AppError('Department name is required', 400);
  }

  const dept = await prisma.department.create({
    data: {
      hospitalId,
      name,
      description,
    },
  });

  await logAudit({
    actorUserId,
    action: 'CREATE_DEPARTMENT',
    entityType: 'Department',
    entityId: dept.id,
    metadata: { hospitalId, name },
  });

  return dept;
}

module.exports = {
  getAllHospitals,
  getHospitalById,
  getHospitalBranches,
  getBranchById,
  getBranchLocation,
  createHospital,
  createBranch,
  getAllDepartments,
  createDepartment,
};
