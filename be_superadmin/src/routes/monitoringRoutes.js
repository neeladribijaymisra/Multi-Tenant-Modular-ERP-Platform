import express from 'express'
import { verifyAuth, verifySuperAdmin } from '../middleware/auth.js'
import {
  getDashboardStats,
  getAuditLogs,
  getSystemHealth,
  getSystemActivity,
} from '../controllers/monitoringController.js'

const router = express.Router()

// All routes require authentication and superadmin role
router.use(verifyAuth, verifySuperAdmin)

router.get('/dashboard-stats', getDashboardStats)
router.get('/audit-logs', getAuditLogs)
router.get('/system-health', getSystemHealth)
router.get('/system-activity', getSystemActivity)

export default router
