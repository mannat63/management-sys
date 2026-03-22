const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

// Minimal Schemas
const StudentSchema = new mongoose.Schema({ institute_id: mongoose.Schema.Types.ObjectId });
const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);

const FeeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  total_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  due_amount: { type: Number, default: 0 },
  due_date: { type: Date, default: Date.now },
  status: { type: String, default: "DUE" },
  institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" }
});
const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);

async function backfill() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB...");

  const students = await Student.find({});
  console.log(`Found ${students.length} students.`);

  let created = 0;
  for (const s of students) {
    const existingFee = await Fee.findOne({ student_id: s._id });
    if (!existingFee) {
      await Fee.create({
        student_id: s._id,
        total_amount: 0,
        paid_amount: 0,
        due_amount: 0,
        due_date: new Date(),
        status: "UNPAID", // or DUE
        institute_id: s.institute_id
      });
      created++;
    }
  }

  console.log(`Backfilled ${created} missing fee records!`);
  process.exit(0);
}

backfill().catch(console.error);
