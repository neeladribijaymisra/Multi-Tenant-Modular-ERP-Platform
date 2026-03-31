import Admin from '../models/Admin.js'
import Tenant from '../models/Tenant.js'
import AuditLog from '../models/AuditLog.js'
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const getAdmins = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10, search } = req.query

    let query = {}
    if (role && role !== 'All') query.role = role
    if (status) query.status = status
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const admins = await Admin.find(query)
      .populate('tenant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Admin.countDocuments(query)

    res.json({
      success: true,
      data: admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('tenant')

    if (!admin) {
      throw new NotFoundError('Admin not found')
    }

    res.json({
      success: true,
      data: admin,
    })
  } catch (error) {
    next(error)
  }
}

export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, tenant } = req.body

    // Validate required fields
    if (!name || !email || !password || !role || !tenant) {
      throw new ValidationError('All fields are required')
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      throw new ConflictError('Admin with this email already exists')
    }

    // Verify tenant exists
    const tenantExists = await Tenant.findById(tenant)
    if (!tenantExists) {
      throw new NotFoundError('Tenant not found')
    }

    const admin = new Admin({
      name,
      email,
      password,
      role,
      tenant,
      avatar: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    })

    await admin.save()

    // Log action
    await AuditLog.create({
      action: 'CREATE',
      entity: 'Admin',
      entityId: admin._id,
      user: req.user?.username,
      changes: { created: admin },
    })

    logger.info(`Admin created`, { adminId: admin._id, email })

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin,
    })
  } catch (error) {
    next(error)
  }
}

export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, role, tenant, status } = req.body

    const admin = await Admin.findById(id)
    if (!admin) {
      throw new NotFoundError('Admin not found')
    }

    // Check email uniqueness if changed
    if (email && email !== admin.email) {
      const existing = await Admin.findOne({ email })
      if (existing) {
        throw new ConflictError('Email already in use')
      }
    }

    const oldData = admin.toObject()

    if (name) admin.name = name
    if (email) admin.email = email
    if (role) admin.role = role
    if (tenant) admin.tenant = tenant
    if (status) admin.status = status

    await admin.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Admin',
      entityId: admin._id,
      user: req.user?.username,
      changes: { before: oldData, after: admin.toObject() },
    })

    logger.info(`Admin updated`, { adminId: id })

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: admin,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params

    const admin = await Admin.findByIdAndDelete(id)
    if (!admin) {
      throw new NotFoundError('Admin not found')
    }

    // Log action
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Admin',
      entityId: id,
      user: req.user?.username,
      changes: { deleted: admin },
    })

    logger.info(`Admin deleted`, { adminId: id })

    res.json({
      success: true,
      message: 'Admin deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const toggleAdminStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    const admin = await Admin.findById(id)
    if (!admin) {
      throw new NotFoundError('Admin not found')
    }

    const oldStatus = admin.status
    admin.status = admin.status === 'active' ? 'inactive' : 'active'
    await admin.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Admin',
      entityId: id,
      user: req.user?.username,
      changes: { status: { from: oldStatus, to: admin.status } },
    })

    logger.info(`Admin status updated`, { adminId: id, status: admin.status })

    res.json({
      success: true,
      message: 'Admin status updated',
      data: admin,
    })
  } catch (error) {
    next(error)
  }
}
