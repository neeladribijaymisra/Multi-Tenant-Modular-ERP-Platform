import { fileURLToPath } from 'url'
import Role from '../models/Role.js'
import Tenant from '../models/Tenant.js'
import { connectDB, disconnectDB } from './connection.js'
import { logger } from '../utils/logger.js'

export const seedDatabase = async () => {
  try {
    // Clear existing data
    await Role.deleteMany({})
    await Tenant.deleteMany({})

    // Seed roles
    const rolesData = [
      {
        name: 'Tenant Admin',
        color: '#6366f1',
        description: 'Full access to tenant systems',
        isSystem: true,
        permissions: {
          'Academic Management': [
            'View Students',
            'Edit Students',
            'Manage Courses',
            'Grade Management',
            'Attendance',
            'Timetable',
          ],
          'Financial Control': [
            'View Fees',
            'Collect Fees',
            'Fee Waiver',
            'Financial Reports',
          ],
          'User Management': [
            'View Users',
            'Create Users',
            'Edit Users',
            'Delete Users',
            'Role Assignment',
          ],
          'System Config': ['View Settings', 'Edit Settings', 'Module Config'],
          'Reports & Analytics': [
            'View Reports',
            'Export Data',
            'Dashboard Access',
            'Analytics',
          ],
        },
      },
      {
        name: 'HOD',
        color: '#06b6d4',
        description: 'Head of Department access',
        isSystem: true,
        permissions: {
          'Academic Management': [
            'View Students',
            'Manage Courses',
            'Grade Management',
            'Attendance',
            'Timetable',
          ],
          'Financial Control': ['View Fees'],
          'User Management': ['View Users'],
          'System Config': ['View Settings'],
          'Reports & Analytics': ['View Reports', 'Dashboard Access'],
        },
      },
      {
        name: 'Finance Admin',
        color: '#10b981',
        description: 'Financial operations manager',
        isSystem: true,
        permissions: {
          'Academic Management': ['View Students'],
          'Financial Control': [
            'View Fees',
            'Collect Fees',
            'Fee Waiver',
            'Expense Management',
            'Financial Reports',
            'Payroll',
          ],
          'User Management': ['View Users'],
          'System Config': ['View Settings'],
          'Reports & Analytics': [
            'View Reports',
            'Export Data',
            'Custom Reports',
          ],
        },
      },
      {
        name: 'Exam Controller',
        color: '#f59e0b',
        description: 'Examination & grading authority',
        isSystem: true,
        permissions: {
          'Academic Management': [
            'View Students',
            'Grade Management',
            'Timetable',
          ],
          'Financial Control': [],
          'User Management': ['View Users'],
          'System Config': ['View Settings'],
          'Reports & Analytics': ['View Reports'],
        },
      },
      {
        name: 'Registrar',
        color: '#8b5cf6',
        description: 'Student records management',
        isSystem: true,
        permissions: {
          'Academic Management': [
            'View Students',
            'Edit Students',
            'Manage Courses',
            'Attendance',
          ],
          'Financial Control': ['View Fees'],
          'User Management': [
            'View Users',
            'Create Users',
            'Edit Users',
          ],
          'System Config': ['View Settings'],
          'Reports & Analytics': [
            'View Reports',
            'Export Data',
            'Dashboard Access',
          ],
        },
      },
    ]

    await Role.insertMany(rolesData)
    logger.info(`Seeded ${rolesData.length} roles`)

    // Seed tenants
    const tenantsData = [
      {
        name: 'MIT University',
        domain: 'mit.erp-system.com',
        type: 'University',
        logo: '🎓',
        plan: 'Enterprise',
        status: 'active',
        contact: {
          name: 'Dr. Ramesh Sharma',
          email: 'admin@mit.edu',
          phone: '+91-9876543210',
        },
        modules: [
          'Academics',
          'Finance',
          'HR',
          'Library',
          'Hostel',
          'Exam',
          'Alumni',
          'Research',
        ],
        maxUsers: 500,
        maxStudents: 25000,
        storageQuota: 100,
        metadata: {
          students: 24500,
          admins: 8,
          courses: 150,
        },
      },
      {
        name: 'IIT Delhi',
        domain: 'iitd.erp-system.com',
        type: 'University',
        logo: '🏛️',
        plan: 'Enterprise',
        status: 'active',
        contact: {
          name: 'Prof. Anita Gupta',
          email: 'admin@iitd.ac.in',
          phone: '+91-9876543211',
        },
        modules: [
          'Academics',
          'Finance',
          'HR',
          'Library',
          'Exam',
          'Research',
        ],
        maxUsers: 400,
        maxStudents: 18500,
        storageQuota: 80,
        metadata: {
          students: 18200,
          admins: 6,
          courses: 120,
        },
      },
      {
        name: 'AIIMS New Delhi',
        domain: 'aiims.erp-system.com',
        type: 'Medical College',
        logo: '🏥',
        plan: 'Pro',
        status: 'active',
        contact: {
          name: 'Dr. Suresh Patil',
          email: 'admin@aiims.edu',
          phone: '+91-9876543212',
        },
        modules: [
          'Academics',
          'Finance',
          'HR',
          'Hostel',
          'Research',
        ],
        maxUsers: 200,
        maxStudents: 6000,
        storageQuota: 50,
        metadata: {
          students: 5800,
          admins: 5,
          courses: 80,
        },
      },
    ]

    await Tenant.insertMany(tenantsData)
    logger.info(`Seeded ${tenantsData.length} tenants`)

    logger.info('Database seeding completed successfully')
  } catch (error) {
    logger.error('Database seeding failed', error)
    throw error
  }
}

const runSeed = async () => {
  try {
    await connectDB()
    await seedDatabase()
  } catch (error) {
    process.exitCode = 1
  } finally {
    await disconnectDB()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runSeed()
}
