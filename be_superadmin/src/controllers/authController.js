import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import AuditLog from '../models/AuditLog.js'
import { UnauthorizedError, ValidationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      throw new ValidationError('Username and password are required')
    }

    // Check superadmin credentials
    if (
      username === config.superadmin.username &&
      password === config.superadmin.password
    ) {
      const user = {
        username: config.superadmin.username,
        name: 'Super Administrator',
        email: config.superadmin.email,
        avatar: 'SA',
        role: 'superadmin',
      }

      const token = jwt.sign(user, config.jwt.secret, {
        expiresIn: config.jwt.expire,
      })

      logger.info(`Superadmin login successful`, { username })
      await AuditLog.create({
        action: 'LOGIN',
        entity: 'Auth',
        user: username,
        status: 'success',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: 'Superadmin login successful',
      })

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user,
      })
    }

    logger.warn(`Failed login attempt`, { username })
    await AuditLog.create({
      action: 'LOGIN',
      entity: 'Auth',
      user: username,
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: 'Invalid superadmin credentials submitted',
    })
    throw new UnauthorizedError('Invalid credentials')
  } catch (error) {
    next(error)
  }
}

export const verifyToken = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    logger.info(`User logged out`, { username: req.user?.username })
    await AuditLog.create({
      action: 'LOGOUT',
      entity: 'Auth',
      user: req.user?.username || 'unknown',
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: 'Superadmin logged out',
    })
    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    next(error)
  }
}
