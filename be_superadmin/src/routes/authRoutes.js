import express from 'express'
import { login, verifyToken, logout } from '../controllers/authController.js'
import { verifyAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', login)
router.post('/logout', verifyAuth, logout)
router.get('/verify', verifyAuth, verifyToken)

export default router
