import Role from '../models/Role.js'
import AuditLog from '../models/AuditLog.js'
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const getRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query

    let query = {}
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const skip = (page - 1) * limit
    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Role.countDocuments(query)

    res.json({
      success: true,
      data: roles,
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

export const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)

    if (!role) {
      throw new NotFoundError('Role not found')
    }

    res.json({
      success: true,
      data: role,
    })
  } catch (error) {
    next(error)
  }
}

export const createRole = async (req, res, next) => {
  try {
    const { name, description, color, permissions } = req.body

    if (!name) {
      throw new ValidationError('Role name is required')
    }

    const existingRole = await Role.findOne({ name })
    if (existingRole) {
      throw new ConflictError('Role with this name already exists')
    }

    const role = new Role({
      name,
      description,
      color: color || '#6366f1',
      permissions: permissions || {
        'Academic Management': [],
        'Financial Control': [],
        'User Management': [],
        'System Config': [],
        'Reports & Analytics': [],
      },
    })

    await role.save()

    // Log action
    await AuditLog.create({
      action: 'CREATE',
      entity: 'Role',
      entityId: role._id,
      user: req.user?.username,
      changes: { created: role },
    })

    logger.info(`Role created`, { roleId: role._id, name })

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    })
  } catch (error) {
    next(error)
  }
}

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, color, permissions } = req.body

    const role = await Role.findById(id)
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    if (role.isSystem && name !== role.name) {
      throw new ValidationError('Cannot rename system roles')
    }

    const oldData = role.toObject()

    if (name) role.name = name
    if (description !== undefined) role.description = description
    if (color) role.color = color
    if (permissions) role.permissions = permissions

    await role.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Role',
      entityId: id,
      user: req.user?.username,
      changes: { before: oldData, after: role.toObject() },
    })

    logger.info(`Role updated`, { roleId: id })

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params

    const role = await Role.findById(id)
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    if (role.isSystem) {
      throw new ValidationError('Cannot delete system roles')
    }

    await Role.findByIdAndDelete(id)

    // Log action
    await AuditLog.create({
      action: 'DELETE',
      entity: 'Role',
      entityId: id,
      user: req.user?.username,
      changes: { deleted: role },
    })

    logger.info(`Role deleted`, { roleId: id })

    res.json({
      success: true,
      message: 'Role deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
