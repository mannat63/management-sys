import mongoose from "mongoose";

const FeeSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    total_amount: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    status: { type: String, enum: ["PAID", "PARTIAL", "DUE"], default: "DUE" },
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  },
  { timestamps: true }
);

// Auto-calculate status before saving
FeeSchema.pre("save", function () {
  this.due_amount = this.total_amount - this.paid_amount;
  if (this.due_amount <= 0) {
    this.status = "PAID";
    this.due_amount = 0;
  } else if (this.paid_amount > 0) {
    this.status = "PARTIAL";
  } else {
    this.status = "DUE";
  }
});

export default mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
