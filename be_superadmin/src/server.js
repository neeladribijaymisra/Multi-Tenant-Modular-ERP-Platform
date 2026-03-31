import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { config } from './config/env.js'
import { connectDB } from './database/connection.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'
import { recordRequestMetric } from './utils/telemetry.js'

// Routes
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import tenantRoutes from './routes/tenantRoutes.js'
import roleRoutes from './routes/roleRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import monitoringRoutes from './routes/monitoringRoutes.js'

const app = express()

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.cors.origins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
  })
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    recordRequestMetric({
      at: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    })
  })

  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/monitoring', monitoringRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  })
})

// Error handling middleware
app.use(errorHandler)

// Database connection
const startServer = async () => {
  try {
    await connectDB()

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        env: config.nodeEnv,
      })
    })
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...')
  process.exit(0)
})

export default app
