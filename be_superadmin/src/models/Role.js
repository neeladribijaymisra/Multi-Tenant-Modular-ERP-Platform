import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: String,
    color: {
      type: String,
      default: '#6366f1',
    },
    permissions: {
      'Academic Management': [String],
      'Financial Control': [String],
      'User Management': [String],
      'System Config': [String],
      'Reports & Analytics': [String],
    },
    usersCount: {
      type: Number,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false, // System roles cannot be deleted
    },
  },
  { timestamps: true }
)

const Role = mongoose.model('Role', roleSchema)
export default Role
