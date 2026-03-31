import express from 'express'
import { verifyAuth, verifySuperAdmin } from '../middleware/auth.js'
import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
} from '../controllers/adminController.js'

const router = express.Router()

// All routes require authentication and superadmin role
router.use(verifyAuth, verifySuperAdmin)

router.get('/', getAdmins)
router.get('/:id', getAdminById)
router.post('/', createAdmin)
router.put('/:id', updateAdmin)
router.delete('/:id', deleteAdmin)
router.patch('/:id/toggle-status', toggleAdminStatus)

export default router
