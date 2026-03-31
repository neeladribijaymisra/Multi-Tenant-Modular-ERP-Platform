import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import AppSetting from '../models/AppSetting.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// ── Generate Tokens ─────────────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

const getPortalSettingsDoc = async () => {
  let settings = await AppSetting.findOne({ key: 'portal-access' });
  if (!settings) {
    settings = await AppSetting.create({
      key: 'portal-access',
      portalAccess: {
        accounts: false,
        hr: false,
        academics: false,
        masterAdmin: true,
      },
    });
  }
  return settings;
};

// ── @POST /api/auth/login ───────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { username, password, portal = 'masterAdmin' } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username and password are required.', 400);
    }

    const settings = await getPortalSettingsDoc();
    const requestedPortal = ['accounts', 'hr', 'academics', 'masterAdmin'].includes(portal) ? portal : 'masterAdmin';
    if (!settings.portalAccess?.[requestedPortal]) {
      return sendError(res, `${requestedPortal === 'masterAdmin' ? 'Master Admin' : requestedPortal.charAt(0).toUpperCase() + requestedPortal.slice(1)} portal is currently disabled.`, 403);
    }

    // Allow login by username OR email
    const admin = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
      isActive: true,
      isDeleted: false,
    }).select('+password');

    if (!admin || !(await admin.matchPassword(password))) {
      return sendError(res, 'Invalid username or password.', 401);
    }

    if (requestedPortal === 'masterAdmin' && admin.role !== 'superadmin') {
      return sendError(res, 'Only the Master Admin can access this portal.', 403);
    }

    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    // Persist refresh token
    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();
    admin.lastActivityAt = new Date();
    await admin.save({ validateBeforeSave: false });

    logger.info(`Admin login: ${admin.username}`);

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        department: admin.department,
        selectedPortal: requestedPortal,
      },
    }, 'Login successful');

  } catch (error) {
    next(error);
  }
};

export const getPortalSettings = async (req, res, next) => {
  try {
    const settings = await getPortalSettingsDoc();
    return sendSuccess(res, { portalAccess: settings.portalAccess });
  } catch (error) {
    next(error);
  }
};

export const updatePortalSettings = async (req, res, next) => {
  try {
    const settings = await getPortalSettingsDoc();
    settings.portalAccess = {
      accounts: Boolean(req.body.portalAccess?.accounts),
      hr: Boolean(req.body.portalAccess?.hr),
      academics: Boolean(req.body.portalAccess?.academics),
      masterAdmin: true,
    };
    settings.updatedBy = req.admin._id;
    await settings.save();

    return sendSuccess(res, { portalAccess: settings.portalAccess }, 'Portal settings updated successfully');
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/auth/refresh ─────────────────────────────────
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 'Refresh token required.', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.id).select('+refreshToken');

    if (!admin || admin.refreshToken !== token) {
      return sendError(res, 'Invalid refresh token.', 401);
    }

    const accessToken = generateAccessToken(admin._id);
    return sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token.', 401);
  }
};

// ── @POST /api/auth/logout ──────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    await Admin.findByIdAndUpdate(req.admin._id, {
      refreshToken: null,
      lastActivityAt: new Date(),
    });
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// ── @GET /api/auth/me ───────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    return sendSuccess(res, { admin });
  } catch (error) {
    next(error);
  }
};

// ── @PUT /api/auth/change-password ─────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!(await admin.matchPassword(currentPassword))) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    admin.password = newPassword;
    admin.lastActivityAt = new Date();
    await admin.save();

    logger.info(`Password changed: ${admin.username}`);
    return sendSuccess(res, {}, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// ── @PUT /api/auth/profile ──────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, department } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { name, email, phone, department, lastActivityAt: new Date() },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, { admin }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};
