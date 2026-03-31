import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { UnauthorizedError } from '../utils/errors.js'

export const verifyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error)
    }
    next(new UnauthorizedError('Invalid token'))
  }
}

export const verifySuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return next(new UnauthorizedError('SuperAdmin access required'))
  }
  next()
}
