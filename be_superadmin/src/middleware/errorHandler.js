import { logger } from '../utils/logger.js'
import { AppError } from '../utils/errors.js'

export const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    statusCode: error.statusCode || 500,
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format'
    error = new AppError(message, 400)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    error = new AppError(message, 409)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ')
    error = new AppError(messages, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = new AppError(message, 401)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = new AppError(message, 401)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(isDevelopment && { stack: err.stack }),
    },
  })
}
