# ERP SuperAdmin - Full Stack Project Structure

## Project Overview

This is a full-stack ERP (Enterprise Resource Planning) SuperAdmin Control Center application built with:
- **Frontend**: React 18 + Vite + Material UI + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB

---

## 📁 Complete Directory Structure

```
erp_superadmin/
│
├── frontend/                          # React + Vite frontend application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.jsx                  # React entry point with Material UI theme
│   │   ├── App.jsx                   # Route definitions
│   │   ├── index.css                 # Global styles + Tailwind
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state management
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── DashboardLayout.jsx # Main layout with sidebar
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx         # Superadmin login page
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx     # Dashboard with stats & charts
│   │   │   ├── admins/
│   │   │   │   └── ManageAdmins.jsx  # Admin CRUD interface
│   │   │   ├── roles/
│   │   │   │   └── RolesPermissions.jsx # Role permission matrix
│   │   │   ├── tenants/
│   │   │   │   └── ManageTenants.jsx # Tenant management
│   │   │   ├── settings/
│   │   │   │   └── SystemSettings.jsx # Global configuration
│   │   │   └── monitoring/
│   │   │       └── Monitoring.jsx    # System logs & health
│   │   ├── routes/                   # Route configuration
│   │   ├── utils/                    # Utility functions
│   │   └── assets/                   # Images, icons, etc.
│   └── node_modules/
│
├── backend/                           # Node.js/Express REST API
│   ├── package.json
│   ├── .env.example                  # Environment configuration template
│   ├── .gitignore
│   ├── README.md                     # Backend documentation
│   │
│   └── src/
│       ├── server.js                 # Main server entry point
│       │
│       ├── config/
│       │   └── env.js                # Environment configuration loader
│       │
│       ├── routes/                   # API Route definitions
│       │   ├── authRoutes.js         # /api/auth endpoints
│       │   ├── adminRoutes.js        # /api/admins endpoints
│       │   ├── tenantRoutes.js       # /api/tenants endpoints
│       │   ├── roleRoutes.js         # /api/roles endpoints
│       │   ├── settingsRoutes.js     # /api/settings endpoints
│       │   └── monitoringRoutes.js   # /api/monitoring endpoints
│       │
│       ├── controllers/              # Business logic
│       │   ├── authController.js     # Auth logic (login, verify, logout)
│       │   ├── adminController.js    # CRUD operations for admins
│       │   ├── tenantController.js   # CRUD operations for tenants
│       │   ├── roleController.js     # CRUD operations for roles
│       │   ├── settingsController.js # System settings management
│       │   └── monitoringController.js # Dashboard & monitoring logic
│       │
│       ├── models/                   # Mongoose schemas
│       │   ├── Admin.js              # Admin model with password hashing
│       │   ├── Tenant.js             # Tenant model
│       │   ├── Role.js               # Role model with permissions
│       │   ├── Settings.js           # System settings model
│       │   └── AuditLog.js           # Audit trail model
│       │
│       ├── middleware/               # Express middleware
│       │   ├── auth.js               # JWT verification & authorization
│       │   └── errorHandler.js       # Global error handling
│       │
│       ├── utils/
│       │   ├── errors.js             # Custom error classes
│       │   └── logger.js             # Logging utility
│       │
│       └── database/
│           ├── connection.js         # MongoDB connection setup
│           └── seed.js               # Database seeding script
│
└── README.md                         # Main project documentation
```

---

## 🔑 Key Features by Component

### Frontend Features
- **Authentication**: Hardcoded superadmin credentials with localStorage persistence
- **Dashboard**: Real-time statistics, charts using Recharts & MUI
- **Admin Management**: CRUD operations with role-based filtering
- **Tenant Management**: Add/manage tenants with support level
- **Roles & Permissions**: Matrix-based permission assignment
- **System Settings**: Academic, financial, and global configuration
- **Monitoring**: System logs, infrastructure monitoring

### Backend Features
- **RESTful API**: Clean REST API with proper HTTP methods
- **Authentication**: JWT-based authentication with superadmin verification
- **Database**: MongoDB with Mongoose ODM for data persistence
- **Models**: Admin, Tenant, Role, Settings, AuditLog
- **Audit Trail**: Complete logging of all administrative actions
- **Error Handling**: Centralized error handling with custom error classes
- **Security**: Password hashing, CORS, input validation
- **Pagination**: All list endpoints support pagination
- **Filtering**: Advanced filtering and search capabilities

---

## 🚀 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout

### Admin Management
- `GET /api/admins` - List admins (paginated, filtered)
- `POST /api/admins` - Create admin
- `GET /api/admins/:id` - Get admin details
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin
- `PATCH /api/admins/:id/toggle-status` - Toggle status

### Tenant Management
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `PATCH /api/tenants/:id/toggle-status` - Toggle status

### Role Management
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `GET /api/roles/:id` - Get role details
- `PUT /api/roles/:id` - Update role (with permissions)
- `DELETE /api/roles/:id` - Delete role

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings?category=academic` - Get by category
- `PUT /api/settings` - Update settings
- `POST /api/settings/reset` - Reset to defaults

### Monitoring
- `GET /api/monitoring/dashboard-stats` - Dashboard statistics
- `GET /api/monitoring/audit-logs` - Audit trail
- `GET /api/monitoring/system-health` - System health status
- `GET /api/monitoring/system-activity` - Activity metrics

---

## 🛠️ Getting Started

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Seeding
```bash
cd backend
npm run seed
```

---

## 📋 Default Credentials

**Superadmin**
- Username: `superadmin`
- Password: `Admin@1234`

---

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation on both frontend and backend
- Audit logging of all operations
- Role-based access control

---

## 📊 Data Models

### Admin
- name, email, password, role, tenant
- status (active/inactive/suspended)
- avatar, lastLogin
- Timestamps

### Tenant
- name, domain, type, logo, description
- status, plan (Starter/Pro/Enterprise)
- contact info, modules, quotas
- Metadata (students, admins, courses count)

### Role
- name, description, color
- permissions (5 categories × multiple permissions)
- usersCount, isSystem flag
- Full permission matrix

### Settings
- category (academic, fee, global, security)
- data (JSON structure)
- updatedBy, timestamps

### AuditLog
- action, entity, entityId
- user, changes, status
- ipAddress, userAgent
- timestamps

---

## 🌐 Frontend Routes

- `/login` - Superadmin login
- `/dashboard` - Dashboard home
- `/admins` - Admin management
- `/roles` - Roles & permissions
- `/tenants` - Tenant management
- `/settings` - System settings
- `/monitoring` - System monitoring

---

## ✅ Project Status

✅ Frontend - Complete UI implementation
✅ Backend - Full REST API with MongoDB
✅ Database Models - All entities defined
✅ Authentication - JWT-based system
✅ Error Handling - Centralized error management
✅ Logging - Audit trail implementation
✅ Documentation - Complete API & setup docs

