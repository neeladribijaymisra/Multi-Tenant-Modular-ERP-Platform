import Settings from '../models/Settings.js'
import AuditLog from '../models/AuditLog.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

const defaultSettings = {
  academic: {
    year: '2024-25',
    startMonth: 'July',
    endMonth: 'June',
    semesterType: 'Semester',
    maxBacklogs: '3',
    gradingSystem: 'CGPA (10)',
  },
  fee: {
    lateFine: '50',
    graceDays: '7',
    refundPolicy: '30',
    taxPercent: '18',
    currency: 'INR',
    paymentGateway: 'Razorpay',
  },
  global: {
    maintenanceMode: false,
    allowRegistration: true,
    emailNotif: true,
    smsNotif: false,
    backupFreq: 'Daily',
    sessionTimeout: '30',
  },
  security: {
    passwordMinLength: 8,
    passwordExpiry: '90',
    twoFactorAuth: false,
    apiKeyRotation: '30',
    ipWhitelist: [],
  },
}

export const getSettings = async (req, res, next) => {
  try {
    const { category } = req.query

    if (category) {
      let settings = await Settings.findOne({ category })

      if (!settings) {
        // Create default if not exists
        settings = new Settings({
          category,
          data: defaultSettings[category],
        })
        await settings.save()
      }

      return res.json({
        success: true,
        data: settings,
      })
    }

    // Get all settings
    const allSettings = {}
    for (const cat of Object.keys(defaultSettings)) {
      let setting = await Settings.findOne({ category: cat })
      if (!setting) {
        setting = new Settings({
          category: cat,
          data: defaultSettings[cat],
        })
        await setting.save()
      }
      allSettings[cat] = setting
    }

    res.json({
      success: true,
      data: allSettings,
    })
  } catch (error) {
    next(error)
  }
}

export const updateSettings = async (req, res, next) => {
  try {
    const { category, data } = req.body

    if (!category || !data) {
      throw new ValidationError('Category and data are required')
    }

    let settings = await Settings.findOne({ category })

    if (!settings) {
      settings = new Settings({
        category,
        data: defaultSettings[category],
      })
    }

    const oldData = settings.data

    settings.data = { ...settings.data, ...data }
    settings.updatedBy = req.user?.username

    await settings.save()

    // Log action
    await AuditLog.create({
      action: 'UPDATE',
      entity: 'Settings',
      entityId: settings._id,
      user: req.user?.username,
      changes: { category, before: oldData, after: settings.data },
    })

    logger.info(`Settings updated`, { category })

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    })
  } catch (error) {
    next(error)
  }
}

export const resetSettings = async (req, res, next) => {
  try {
    const { category } = req.body

    if (!category) {
      throw new ValidationError('Category is required')
    }

    let settings = await Settings.findOne({ category })

    if (!settings) {
      settings = new Settings({
        category,
        data: defaultSettings[category],
      })
    }

    const oldData = settings.data
    settings.data = defaultSettings[category]
    settings.updatedBy = req.user?.username

    await settings.save()

    // Log action
    await AuditLog.create({
      action: 'RESET',
      entity: 'Settings',
      entityId: settings._id,
      user: req.user?.username,
      changes: { category, before: oldData, after: settings.data },
    })

    logger.info(`Settings reset to defaults`, { category })

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      data: settings,
    })
  } catch (error) {
    next(error)
  }
}
