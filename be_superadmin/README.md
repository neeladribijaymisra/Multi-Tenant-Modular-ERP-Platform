# ERP SuperAdmin Backend

A production-grade REST API backend for the ERP SuperAdmin Control Center.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- MongoDB 5.0+

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your configuration
```

### Environment Setup

Edit `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/erp_superadmin
JWT_SECRET=your_secure_secret_key
```

### Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Seed Database

```bash
npm run seed
```

## 📚 API Documentation

### Authentication Endpoints

**POST /api/auth/login**
- Login with superadmin credentials
- Body: `{ username, password }`

**GET /api/auth/verify**
- Verify JWT token (requires Authorization header)

**POST /api/auth/logout**
- Logout user (requires Authorization header)

### Admin Endpoints

**GET /api/admins** - Get all admins (with pagination & filtering)
**POST /api/admins** - Create new admin
**GET /api/admins/:id** - Get admin by ID
**PUT /api/admins/:id** - Update admin
**DELETE /api/admins/:id** - Delete admin
**PATCH /api/admins/:id/toggle-status** - Toggle admin status

### Tenant Endpoints

**GET /api/tenants** - Get all tenants (with pagination & filtering)
**POST /api/tenants** - Create new tenant
**GET /api/tenants/:id** - Get tenant by ID
**PUT /api/tenants/:id** - Update tenant
**DELETE /api/tenants/:id** - Delete tenant
**PATCH /api/tenants/:id/toggle-status** - Toggle tenant status

### Role Endpoints

**GET /api/roles** - Get all roles
**POST /api/roles** - Create new role
**GET /api/roles/:id** - Get role by ID
**PUT /api/roles/:id** - Update role
**DELETE /api/roles/:id** - Delete role

### Settings Endpoints

**GET /api/settings** - Get all settings
**GET /api/settings?category=academic** - Get settings by category
**PUT /api/settings** - Update settings
**POST /api/settings/reset** - Reset settings to defaults

### Monitoring Endpoints

**GET /api/monitoring/dashboard-stats** - Get dashboard statistics
**GET /api/monitoring/audit-logs** - Get audit logs
**GET /api/monitoring/system-health** - Get system health status
**GET /api/monitoring/system-activity** - Get system activity metrics

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Superadmin credentials (default):
- Username: `superadmin`
- Password: `Admin@1234`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── database/        # Database setup
│   └── server.js        # Main server file
├── package.json
└── .env.example
```

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database & ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests
- **Morgan** - HTTP logging

## 📝 License

MIT
