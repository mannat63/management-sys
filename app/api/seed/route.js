import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import User from "@/models/User";
import Institute from "@/models/Institute";
import Course from "@/models/Course";
import Batch from "@/models/Batch";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";
import Test from "@/models/Test";
import Result from "@/models/Result";
import { INSTITUTE_NAME } from "@/config/appConfig";

export async function POST() {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    const iid = authUser.institute_id;

    // Check if already seeded
    const existingStudents = await Student.countDocuments({ institute_id: iid });
    if (existingStudents > 0) {
      return NextResponse.json({ message: "Data already seeded!", count: existingStudents });
    }

    // Ensure teacher user exists
    let teacherUser = await User.findOne({ phoneOrEmail: "teacher@gmail.com", institute_id: iid });
    if (!teacherUser) {
      teacherUser = await User.create({ name: "Priya Sharma", phoneOrEmail: "teacher@gmail.com", role: "TEACHER", institute_id: iid });
    }

    // Teacher profile
    let teacher = await Teacher.findOne({ user_id: teacherUser._id });
    if (!teacher) {
      teacher = await Teacher.create({ user_id: teacherUser._id, institute_id: iid });
    }

    // Courses
    const courseJEE = await Course.create({ name: "JEE", institute_id: iid });
    const course10 = await Course.create({ name: "Class 10", institute_id: iid });

    // Batches
    const batchJEE = await Batch.create({ name: "JEE Morning", course_id: courseJEE._id, teacher_id: teacher._id, timing: "8:00 AM - 10:00 AM", institute_id: iid });
    const batch10 = await Batch.create({ name: "10th Evening", course_id: course10._id, teacher_id: teacher._id, timing: "4:00 PM - 6:00 PM", institute_id: iid });

    // Students
    const studentData = [
      { name: "Aarav Patel", phone: "aarav@test.com", parent: "Suresh Patel", parentPhone: "+919111111111", batch: batchJEE._id },
      { name: "Diya Singh", phone: "diya@test.com", parent: "Ramesh Singh", parentPhone: "+919222222222", batch: batchJEE._id },
      { name: "Vihaan Gupta", phone: "vihaan@test.com", parent: "Anil Gupta", parentPhone: "+919333333333", batch: batchJEE._id },
      { name: "Ananya Rao", phone: "ananya@test.com", parent: "Kiran Rao", parentPhone: "+919444444444", batch: batch10._id },
      { name: "Rohan Verma", phone: "rohan@test.com", parent: "Deepak Verma", parentPhone: "+919555555555", batch: batch10._id },
    ];

    const students = [];
    for (const s of studentData) {
      const u = await User.create({ name: s.name, phoneOrEmail: s.phone, role: "STUDENT", institute_id: iid });
      const student = await Student.create({ user_id: u._id, batch_id: s.batch, parent_name: s.parent, parent_phone: s.parentPhone, institute_id: iid });
      students.push(student);
    }

    // Fees (mix of PAID, PARTIAL, DUE)
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const feeAmounts = [
      { paid: 5000, total: 5000 },  // PAID
      { paid: 3000, total: 5000 },  // PARTIAL
      { paid: 0, total: 5000 },     // DUE
      { paid: 5000, total: 5000 },  // PAID
      { paid: 1000, total: 5000 },  // PARTIAL
    ];
    for (let i = 0; i < students.length; i++) {
      const f = new Fee({
        student_id: students[i]._id,
        total_amount: feeAmounts[i].total,
        paid_amount: feeAmounts[i].paid,
        due_amount: feeAmounts[i].total - feeAmounts[i].paid,
        due_date: dueDate,
        institute_id: iid,
      });
      await f.save(); // triggers pre-save hook for status
    }

    // Attendance (last 5 days)
    const today = new Date();
    for (let d = 1; d <= 5; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      for (const student of students) {
        await Attendance.create({
          student_id: student._id,
          batch_id: student.batch_id,
          date,
          status: Math.random() > 0.2 ? "PRESENT" : "ABSENT",
          institute_id: iid,
        });
      }
    }

    // Test + Results
    const test = await Test.create({ name: "Mid-Term Physics", batch_id: batchJEE._id, date: new Date(), total_marks: 100, institute_id: iid });
    const jeeStudents = students.filter((s) => s.batch_id.toString() === batchJEE._id.toString());
    for (const student of jeeStudents) {
      await Result.create({ test_id: test._id, student_id: student._id, marks: Math.floor(Math.random() * 40 + 60), institute_id: iid });
    }

    return NextResponse.json({ message: "Seed complete!", students: students.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
