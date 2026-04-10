import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, unique: true },
    feeReminders: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: true },
    razorpay_link: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
