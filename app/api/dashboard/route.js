import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Fee from "@/models/Fee";
import Attendance from "@/models/Attendance";

export async function GET() {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    const iid = authUser.institute_id;

    if (authUser.role === "ADMIN") {
      // Correct for India Timezone (+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayUTC = new Date(now.getTime() + istOffset);
      todayUTC.setUTCHours(0, 0, 0, 0);

      const [totalStudents, fees, todayAttendance] = await Promise.all([
        Student.countDocuments({ institute_id: iid }),
        Fee.find({ institute_id: iid }),
        Attendance.find({ institute_id: iid, date: todayUTC }),
      ]);

      const totalFees = fees.reduce((sum, f) => sum + f.total_amount, 0);
      const collectedFees = fees.reduce((sum, f) => sum + f.paid_amount, 0);
      const pendingFees = totalFees - collectedFees;

      const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
      const absentToday = todayAttendance.filter((a) => a.status === "ABSENT").length;

      return NextResponse.json({
        totalStudents,
        totalFees,
        collectedFees,
        pendingFees,
        presentToday,
        absentToday,
        role: "ADMIN"
      });
    }

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) return NextResponse.json({ batchesCount: 0, studentCount: 0, role: "TEACHER" });

      const batches = await Batch.find({ teacher_id: teacher._id }).select("_id");
      const batchIds = batches.map(b => b._id);
      
      const studentCount = await Student.countDocuments({ batch_id: { $in: batchIds } });

      return NextResponse.json({
        batchesCount: batches.length,
        studentCount,
        role: "TEACHER"
      });
    }

    if (authUser.role === "STUDENT") {
      const student = await Student.findOne({ user_id: authUser._id });
      if (!student) return NextResponse.json({ pendingFees: 0, presentCount: 0, totalAttendanceDays: 0, role: "STUDENT" });

      const [myFees, attendances] = await Promise.all([
        Fee.find({ student_id: student._id }),
        Attendance.find({ student_id: student._id })
      ]);

      const pendingFees = myFees.reduce((sum, f) => sum + (f.total_amount - f.paid_amount), 0);
      const presents = attendances.filter((a) => a.status === "PRESENT").length;

      return NextResponse.json({
        pendingFees,
        presentCount: presents,
        totalAttendanceDays: attendances.length,
        role: "STUDENT"
      });
    }

    return NextResponse.json({ role: "UNKNOWN" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
