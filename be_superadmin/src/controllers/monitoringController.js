import mongoose from 'mongoose'
import Admin from '../models/Admin.js'
import Tenant from '../models/Tenant.js'
import Role from '../models/Role.js'
import AuditLog from '../models/AuditLog.js'
import { summarizeRequestMetrics } from '../utils/telemetry.js'

function getRangeWindow(range = 'today') {
  const normalized = ['today', 'week', 'month'].includes(range) ? range : 'today'
  const endDate = new Date()
  const startDate = new Date(endDate)

  if (normalized === 'today') {
    startDate.setHours(0, 0, 0, 0)
  } else if (normalized === 'week') {
    startDate.setDate(endDate.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate.setDate(endDate.getDate() - 29)
    startDate.setHours(0, 0, 0, 0)
  }

  return { range: normalized, startDate, endDate }
}

function getBucketFormat(range) {
  return range === 'today' ? '%Y-%m-%d %H:00' : '%Y-%m-%d'
}

function getRangeLabel(value, range) {
  const date = range === 'today' ? new Date(`${value}:00`) : new Date(value)
  return date.toLocaleDateString(
    'en-IN',
    range === 'today'
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short' }
  )
}

export const getDashboardStats = async (req, res, next) => {
  try {
    const { range = 'today' } = req.query
    const { startDate, endDate, range: normalizedRange } = getRangeWindow(range)

    const [totalAdmins, activeTenants, pendingTenants, totalRoles, failedLoginAttempts, systemErrorCount, activeUsersRaw] = await Promise.all([
      Admin.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      Tenant.countDocuments({ status: 'pending' }),
      Role.countDocuments(),
      AuditLog.countDocuments({
        action: 'LOGIN',
        status: 'failure',
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      AuditLog.countDocuments({
        status: 'failure',
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      AuditLog.distinct('user', {
        status: 'success',
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    ])

    const [adminsByRole, tenantsByPlan, recentAdmins, activityTrend] = await Promise.all([
      Admin.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Tenant.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      Admin.find().select('name email role status createdAt').sort({ createdAt: -1 }).limit(5),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: getBucketFormat(normalizedRange), date: '$createdAt' },
            },
            total: { $sum: 1 },
            failures: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failure'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    const requestMetrics = summarizeRequestMetrics({ since: startDate })

    res.json({
      success: true,
      data: {
        range: normalizedRange,
        summary: {
          totalAdmins,
          activeTenants,
          pendingTenants,
          totalRoles,
          activeUsers: activeUsersRaw.filter(Boolean).length,
          failedLoginAttempts,
          systemErrorCount,
          averageApiResponseTime: requestMetrics.averageResponseTime,
        },
        adminsByRole,
        tenantsByPlan,
        recentAdmins,
        activityTrend: activityTrend.map((item) => ({
          label: getRangeLabel(item._id, normalizedRange),
          total: item.total,
          failures: item.failures,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, startDate, endDate, page = 1, limit = 20 } = req.query

    const query = {}
    if (entity) query.entity = entity
    if (action) query.action = action
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt.$lte = end
      }
    }

    const skip = (page - 1) * limit
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
    const total = await AuditLog.countDocuments(query)

    res.json({
      success: true,
      data: logs,
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

export const getSystemHealth = async (req, res, next) => {
  try {
    const { range = 'today' } = req.query
    const { startDate, endDate, range: normalizedRange } = getRangeWindow(range)
    const memoryUsage = process.memoryUsage()
    const requestMetrics = summarizeRequestMetrics({ since: startDate })

    const [recentErrors, failedLogins, activeUsersRaw] = await Promise.all([
      AuditLog.countDocuments({ status: 'failure', createdAt: { $gte: startDate, $lte: endDate } }),
      AuditLog.countDocuments({ action: 'LOGIN', status: 'failure', createdAt: { $gte: startDate, $lte: endDate } }),
      AuditLog.distinct('user', { status: 'success', createdAt: { $gte: startDate, $lte: endDate } }),
    ])

    const dbReadyState = mongoose.connection.readyState
    const dbStatus = dbReadyState === 1 ? 'online' : dbReadyState === 2 ? 'connecting' : 'offline'

    res.json({
      success: true,
      data: {
        range: normalizedRange,
        status: recentErrors > 0 ? 'warning' : 'healthy',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date(),
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
        recentErrors24h: recentErrors,
        failedLoginAttempts: failedLogins,
        activeUsers: activeUsersRaw.filter(Boolean).length,
        apiResponseTimeMs: requestMetrics.averageResponseTime,
        serverStatus: 'online',
        dbStatus,
        apiStatus: requestMetrics.errorCount > 0 ? 'degraded' : 'online',
        apiLastRequestAt: requestMetrics.lastRequestAt,
        dbName: mongoose.connection.name || 'unknown',
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getSystemActivity = async (req, res, next) => {
  try {
    const { range = 'today' } = req.query
    const { startDate, endDate, range: normalizedRange } = getRangeWindow(range)

    const [activityByHour, actionBreakdown, entityBreakdown, failedLoginLogs] = await Promise.all([
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: getBucketFormat(normalizedRange), date: '$createdAt' },
            },
            count: { $sum: 1 },
            failedLogins: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'failure'] },
                      { $eq: ['$action', 'LOGIN'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$entity', count: { $sum: 1 } } },
      ]),
      AuditLog.find({
        action: 'LOGIN',
        status: 'failure',
        createdAt: { $gte: startDate, $lte: endDate },
      }).sort({ createdAt: -1 }).limit(10),
    ])

    res.json({
      success: true,
      data: {
        range: normalizedRange,
        activityByHour,
        actionBreakdown,
        entityBreakdown,
        failedLoginLogs,
      },
    })
  } catch (error) {
    next(error)
  }
}
