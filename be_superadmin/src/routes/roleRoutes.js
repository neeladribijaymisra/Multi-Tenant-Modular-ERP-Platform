import express from 'express'
import { verifyAuth, verifySuperAdmin } from '../middleware/auth.js'
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js'

const router = express.Router()

// All routes require authentication and superadmin role
router.use(verifyAuth, verifySuperAdmin)

router.get('/', getRoles)
router.get('/:id', getRoleById)
router.post('/', createRole)
router.put('/:id', updateRole)
router.delete('/:id', deleteRole)

export default router
