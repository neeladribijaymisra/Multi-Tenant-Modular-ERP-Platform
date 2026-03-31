import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['academic', 'fee', 'global', 'security'],
      required: true,
      unique: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
)

const Settings = mongoose.model('Settings', settingsSchema)
export default Settings
