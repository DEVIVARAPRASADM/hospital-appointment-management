const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    message = `A conflict occurred: record with this unique value already exists${target}.`;
  }

  // Handle Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested resource was not found.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  const response = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
