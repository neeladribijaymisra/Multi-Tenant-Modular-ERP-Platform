import mongoose from 'mongoose';

const appSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    portalAccess: {
      accounts: { type: Boolean, default: false },
      hr: { type: Boolean, default: false },
      academics: { type: Boolean, default: false },
      masterAdmin: { type: Boolean, default: true },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);
export default AppSetting;
