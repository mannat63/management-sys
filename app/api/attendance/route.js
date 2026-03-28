import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const batch_id = searchParams.get("batch_id");

    const query = { institute_id: authUser.institute_id };
    if (date) {
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!teacher) return NextResponse.json([], { status: 200 });

      const batches = await Batch.find(
        { teacher_id: teacher._id },
        { _id: 1 }
      ).lean();
      const batchIds = batches.map((b) => b._id.toString());

      if (batch_id && !batchIds.includes(batch_id)) {
        return NextResponse.json(
          { error: "Forbidden: Not your batch" },
          { status: 403 }
        );
      }
      query.batch_id = batch_id ? batch_id : { $in: batchIds };
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!student) return NextResponse.json([], { status: 200 });
      query.student_id = student._id;
    } else {
      if (batch_id) query.batch_id = batch_id;
    }

    // Only fetch fields needed by the UI — no full document populate
    const attendance = await Attendance.find(query)
      .select("student_id batch_id date status")
      .lean();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
