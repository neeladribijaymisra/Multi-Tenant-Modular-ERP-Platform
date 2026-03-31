# ERP SuperAdmin Frontend

A production-grade SuperAdmin Control Center for ERP system built with React (Vite) + Tailwind CSS + Material UI.

## 🔐 Login Credentials

| Field    | Value          |
|----------|----------------|
| Username | `superadmin`   |
| Password | `Admin@1234`   |

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

## 📁 Project Structure

```
erp_superadmin/
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx              # App entry point (MUI theme setup)
        ├── App.jsx               # Route definitions
        ├── index.css             # Global styles + Tailwind
        ├── context/
        │   └── AuthContext.jsx   # Auth state + login logic
        ├── components/
        │   └── layout/
        │       └── DashboardLayout.jsx  # Sidebar + topbar
        └── pages/
            ├── auth/
            │   └── Login.jsx          # Login page
            ├── dashboard/
            │   └── Dashboard.jsx      # Stats + charts
            ├── admins/
            │   └── ManageAdmins.jsx   # CRUD admins
            ├── roles/
            │   └── RolesPermissions.jsx # Role permission matrix
            ├── tenants/
            │   └── ManageTenants.jsx  # Tenant management
            ├── settings/
            │   └── SystemSettings.jsx # Global config
            └── monitoring/
                └── Monitoring.jsx     # Logs + infrastructure
```

## 🗂️ Key Pages

| Page              | Route         | Description                          |
|-------------------|---------------|--------------------------------------|
| Login             | `/login`      | Secure login with credential check   |
| Dashboard         | `/dashboard`  | Stats, charts, alerts                |
| Tenants           | `/tenants`    | Add/manage university tenants        |
| Manage Admins     | `/admins`     | Create/delete/assign roles to admins |
| Roles & Permissions | `/roles`   | Define & assign permissions per role |
| Monitoring        | `/monitoring` | System logs, infrastructure health  |
| System Settings   | `/settings`   | Academic, fee, global config         |

## 🛠️ Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **Material UI 5** (components + icons)
- **React Router v6**
- **Recharts** (charts + analytics)

## 📦 Build for Production

```bash
npm run build
# Output: ./dist/
```
