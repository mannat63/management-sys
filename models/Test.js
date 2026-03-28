import mongoose from "mongoose";

const TestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    date: { type: Date, required: true },
    total_marks: { type: Number, required: true },
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  },
  { timestamps: true }
);

TestSchema.index({ institute_id: 1, batch_id: 1 });
TestSchema.index({ institute_id: 1, date: -1 });

export default mongoose.models.Test || mongoose.model("Test", TestSchema);
