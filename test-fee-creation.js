const mongoose = require("mongoose");
const dotenv = require("dotenv");

// In this script we'll use the models directly as I want to test the `pre` save hook
// However, the models might not be easily importable here as they're inside Next.js with ESM.
// I'll define a quick schema for testing.

dotenv.config({ path: ".env.local" });

const FeeSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    total_amount: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    status: { type: String, enum: ["PAID", "PARTIAL", "DUE"], default: "DUE" },
    institute_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

FeeSchema.pre("save", function (next) {
  this.due_amount = this.total_amount - this.paid_amount;
  if (this.due_amount <= 0) {
    this.status = "PAID";
    this.due_amount = 0;
  } else if (this.paid_amount > 0) {
    this.status = "PARTIAL";
  } else {
    this.status = "DUE";
  }
  next();
});

const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const student = await mongoose.connection.db.collection("students").findOne({});
  if (!student) {
    console.log("No student found");
    return;
  }

  try {
    const fee = await Fee.create({
      student_id: student._id,
      total_amount: 1000,
      due_amount: 1000,
      due_date: new Date(),
      institute_id: student.institute_id
    });
    console.log("Fee created:", fee._id);
  } catch (err) {
    console.error("FAILED to create fee:", err.message);
  }

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
