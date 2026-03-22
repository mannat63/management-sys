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

export default mongoose.models.Test || mongoose.model("Test", TestSchema);
