import express from 'express'
import { verifyAuth, verifySuperAdmin } from '../middleware/auth.js'
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
} from '../controllers/tenantController.js'

const router = express.Router()

// All routes require authentication and superadmin role
router.use(verifyAuth, verifySuperAdmin)

router.get('/', getTenants)
router.get('/:id', getTenantById)
router.post('/', createTenant)
router.put('/:id', updateTenant)
router.delete('/:id', deleteTenant)
router.patch('/:id/toggle-status', toggleTenantStatus)

export default router
