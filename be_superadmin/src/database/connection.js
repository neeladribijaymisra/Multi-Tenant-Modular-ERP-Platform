import mongoose from 'mongoose'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri)

    logger.info('Database connected', {
      host: conn.connection.host,
      db: conn.connection.name,
    })
    return conn
  } catch (error) {
    logger.error('Database connection failed', error)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    logger.info('Database disconnected')
  } catch (error) {
    logger.error('Database disconnection failed', error)
  }
}
