const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config');
const AppError = require('../utils/AppError');

async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication token is required', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return next(new AppError('Invalid or expired authentication token', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    if (user.accountStatus !== 'ACTIVE') {
      return next(new AppError('User account is inactive or suspended', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Forbidden: Role '${req.user.role}' is not authorized for this action`, 403)
      );
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
