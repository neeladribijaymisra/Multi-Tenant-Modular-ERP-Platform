import express from 'express';
import {
  login, logout, refreshToken,
  getMe, changePassword, updateProfile, getPortalSettings, updatePortalSettings,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';

const router = express.Router();

// Public
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/refresh', refreshToken);
router.get('/portal-settings', getPortalSettings);

// Protected
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/portal-settings', authorize('superadmin'), updatePortalSettings);
router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

export default router;
