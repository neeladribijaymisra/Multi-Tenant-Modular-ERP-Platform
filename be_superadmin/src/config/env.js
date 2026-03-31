import dotenv from 'dotenv'

dotenv.config()

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_superadmin',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  superadmin: {
    username: process.env.SUPERADMIN_USERNAME || 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD || 'Admin@1234',
    email: process.env.SUPERADMIN_EMAIL || 'superadmin@erp-system.com',
  },
  cors: {
    origins: corsOrigins,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}
