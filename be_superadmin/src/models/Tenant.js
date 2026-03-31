import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      unique: true,
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['University', 'Medical College', 'Research Institute', 'School', 'Other'],
      default: 'University',
    },
    logo: String,
    description: String,
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },
    plan: {
      type: String,
      enum: ['Starter', 'Pro', 'Enterprise'],
      default: 'Starter',
    },
    contact: {
      name: String,
      email: String,
      phone: String,
    },
    modules: [String],
    maxUsers: {
      type: Number,
      default: 100,
    },
    maxStudents: {
      type: Number,
      default: 1000,
    },
    storageQuota: {
      type: Number,
      default: 50, // in GB
    },
    metadata: {
      students: { type: Number, default: 0 },
      admins: { type: Number, default: 0 },
      courses: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

const Tenant = mongoose.model('Tenant', tenantSchema)
export default Tenant
