import Tenant from '../models/Tenant.js'
import Admin from '../models/Admin.js'
import AuditLog from '../models/AuditLog.js'
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const getTenants = async (req, res, next) => {
  try {
    const { status, plan, page = 1, limit = 10, search } = req.query

    let query = {}
    if (status) query.status = status
    if (plan) query.plan = plan
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const tenants = await Tenant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Tenant.countDocuments(query)

    res.json({
      success: true,
      data: tenants,
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

export const getTenantById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id)

    if (!tenant) {
      throw new NotFoundError('Tenant not found')
    }

    // Get tenant admins count
    const adminCount = await Admin.countDocuments({ tenant: tenant._id })
    tenant.metadata.admins = adminCount

    res.json({
      success: true,
      data: tenant,
    })
  } catch (error) {
    next(error)
  }
}

export const createTenant = async (req, res, next) => {
  try {
    const {
      name,
      domain,
      type,
      plan,
      contact,
      modules,
      maxUsers,
      maxStudents,
      storageQuota,
    } = req.body

    if (!name || !domain) {
      throw new ValidationError('Name and domain are required')
    }

    // Check if tenant with same domain exists
    const existingTenant = await Tenant.findOne({
      $or: [{ name }, { domain }],
    })
    if (existingTenant) {
      throw new ConflictError('Tenant with this name or domain already exists')
    }

    const tenant = new Tenant({
      name,
      domain: domain.toLowerCase(),
      type,
      plan,
      contact,
      modules: modules || [],
      maxUsers: maxUsers || 100,
      maxStudents: maxStudents || 1000,
      storageQuota: storageQuota || 50,
    })

    await tenant.save()

    // Log action
    await AuditLog.create({
      action: 'CREATE',
      entity: 'Tenant',
      entityId: tenant._id,
      user: req.user?.username,
      changes: { created: tenant },
    })

    logger.info(`Tenant created`, { tenantId: tenant._id, name })

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    })
  } catch (error) {
    next(error)
  }
}

export const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      throw new NotFoundError('Tenant not found')
    }

    const oldData = tenant.toObject()

    Object.keys(updateData).forEach((key) => {
      if (key !== '__v' && key !== '_id') {
        tenant[key] = updateData[key]
      }
    })

    await tenant.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      user: req.user?.username,
      changes: { before: oldData, after: tenant.toObject() },
    })

    logger.info(`Tenant updated`, { tenantId: id })

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params

    const tenant = await Tenant.findByIdAndDelete(id)
    if (!tenant) {
      throw new NotFoundError('Tenant not found')
    }

    // Delete associated admins
    await Admin.deleteMany({ tenant: id })

    // Log action
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Tenant',
      entityId: id,
      user: req.user?.username,
      changes: { deleted: tenant },
    })

    logger.info(`Tenant deleted`, { tenantId: id })

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const toggleTenantStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      throw new NotFoundError('Tenant not found')
    }

    const oldStatus = tenant.status
    const newStatus =
      tenant.status === 'active'
        ? 'suspended'
        : tenant.status === 'suspended'
          ? 'active'
          : 'pending'
    tenant.status = newStatus
    await tenant.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Tenant',
      entityId: id,
      user: req.user?.username,
      changes: { status: { from: oldStatus, to: newStatus } },
    })

    logger.info(`Tenant status updated`, { tenantId: id, status: newStatus })

    res.json({
      success: true,
      message: 'Tenant status updated',
      data: tenant,
    })
  } catch (error) {
    next(error)
  }
}
