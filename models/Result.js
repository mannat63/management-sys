import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    marks: { type: Number, required: true },
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  },
  { timestamps: true }
);

// Compound indexes for aggregations and lookups
ResultSchema.index({ institute_id: 1, test_id: 1 });
ResultSchema.index({ institute_id: 1, student_id: 1 });
ResultSchema.index({ test_id: 1, student_id: 1, institute_id: 1 }, { unique: true });

export default mongoose.models.Result || mongoose.model("Result", ResultSchema);
