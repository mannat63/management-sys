import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Institute from "@/models/Institute";
import { sendEventToN8N } from "@/services/n8n";

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]); // Teacher or Admin marks attendance

    const body = await req.json();
    const { student_id, batch_id, date, status } = body;

    // Security: Enforce Teacher batch ownership
    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) throw new Error("Teacher profile not found");
      const batch = await Batch.findOne({ _id: batch_id, teacher_id: teacher._id, institute_id: authUser.institute_id });
      if (!batch) {
        return NextResponse.json({ error: "Forbidden: Not your batch" }, { status: 403 });
      }
    }

    // Normalize to exact midnight UTC
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { student_id, batch_id, date: targetDate, institute_id: authUser.institute_id },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );


    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
