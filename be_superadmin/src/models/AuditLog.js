import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: String,
    user: {
      type: String,
      required: true,
    },
    changes: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
    details: String,
  },
  { timestamps: true }
)

// Index for efficient queries
auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ entity: 1, entityId: 1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
