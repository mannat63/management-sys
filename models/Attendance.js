import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], required: true },
    marked_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  },
  { timestamps: true }
);

// Compound indexes for fast querying by institute + date, batch, student
AttendanceSchema.index({ institute_id: 1, date: 1 });
AttendanceSchema.index({ institute_id: 1, student_id: 1, date: 1 });
AttendanceSchema.index({ institute_id: 1, batch_id: 1, date: 1 });
// Upsert key: unique constraint to prevent duplicate attendance per student per day
AttendanceSchema.index({ student_id: 1, batch_id: 1, date: 1, institute_id: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
