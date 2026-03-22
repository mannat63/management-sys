const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load local environment DB strings
dotenv.config({ path: ".env.local" });

// Pull lightweight schemas for raw database mutations
const StudentSchema = new mongoose.Schema({
  batch_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  admission_date: Date,
  institute_id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { strict: false });

const FeeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  due_date: Date,
  status: String
}, { strict: false });

const AttendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  batch_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["PRESENT", "ABSENT", "LATE"], required: true },
  institute_id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { strict: false });

const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);
const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

async function regenerateMetrics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to the Production DB Cluster...");

  const students = await Student.find({});
  let totalAttendanceInjected = 0;
  let studentsUpdated = 0;

  for (const s of students) {
    if (!s.batch_id || !s.institute_id) {
      console.log(`Skipping student ${s._id} due to missing required batch/institute fields.`);
      continue;
    }

    // 1. Randomize admission date dynamically into the past (between 25 and 90 days ago)
    const randomPastOffset = Math.floor(Math.random() * 65) + 25; // 25-90 days old 
    const historicAdmissionDate = new Date();
    historicAdmissionDate.setDate(historicAdmissionDate.getDate() - randomPastOffset);
    
    // Lock it to Midnight UTC to ensure perfect Date boundary matching on the frontend
    const admissionUtc = new Date(Date.UTC(historicAdmissionDate.getFullYear(), historicAdmissionDate.getMonth(), historicAdmissionDate.getDate()));

    s.admission_date = admissionUtc;
    await s.save();
    studentsUpdated++;

    // 2. Sync their outstanding Fees so that the UI visually charts realistic overdue scenarios
    const fee = await Fee.findOne({ student_id: s._id });
    if (fee) {
      // If PAID, shift their upcoming due date slightly forward 
      if (fee.status === "PAID") {
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() - 10); // arbitrary paid past due
        fee.due_date = nextDue; 
      } else {
        // If UNPAID/DUE, lock their due date exactly 30 days AFTER their historic admission date
        const feeOverdueTarget = new Date(admissionUtc);
        feeOverdueTarget.setDate(feeOverdueTarget.getDate() + 30);
        fee.due_date = feeOverdueTarget;
      }
      await fee.save();
    }

    // 3. Purge existing attendance specifically to prevent Duplicate Key errors on unique indexing
    await Attendance.deleteMany({ student_id: s._id });

    // 4. Generate highly realistic, daily attendance vectors originating identically from the admission_date
    const cursorDate = new Date(admissionUtc);
    const rightNow = new Date(); // To Today
    
    while (cursorDate <= rightNow) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (cursorDate.getDay() !== 0 && cursorDate.getDay() !== 6) {
        
        // Emulate an 85% attendance baseline so Absentees chatbot analysis populates accurately
        const isPresent = Math.random() < 0.85; 
        
        // Enforce pure midnight UTC strings
        const attendanceGmt = new Date(Date.UTC(cursorDate.getFullYear(), cursorDate.getMonth(), cursorDate.getDate()));

        try {
          await Attendance.create({
            student_id: s._id,
            batch_id: s.batch_id,
            date: attendanceGmt,
            status: isPresent ? "PRESENT" : "ABSENT",
            institute_id: s.institute_id
          });
          totalAttendanceInjected++;
        } catch (err) {
          if (err.code !== 11000) { // Ignore strictly if duplicate somehow leaks
            console.error(`Error inserting attendance for student ${s._id}`, err);
          }
        }
      }
      
      // Increment 1 day forward
      cursorDate.setDate(cursorDate.getDate() + 1);
    }
  }

  console.log(`\n✅ Migration Success!`);
  console.log(`-> Displaced ${studentsUpdated} student admission dates into the past.`);
  console.log(`-> Injected ${totalAttendanceInjected} accurately synced attendance vectors!`);
  console.log(`\nYour Dashboard (Fees, Students, Attendance) will now render beautifully spread-out test data.`);
  
  process.exit(0);
}

regenerateMetrics().catch(console.error);
