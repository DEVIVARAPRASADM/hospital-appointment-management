require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'carepoint-hospital-jwt-secret-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
