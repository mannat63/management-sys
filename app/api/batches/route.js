import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Batch from "@/models/Batch";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    let query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) return NextResponse.json([], { status: 200 }); // No batches if teacher profile not setup
      query.teacher_id = teacher._id;
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne({ user_id: authUser._id });
      if (!student) return NextResponse.json([], { status: 200 }); // No batch if student not enrolled
      query._id = student.batch_id;
    }

    const batches = await Batch.find(query)
      .populate("course_id", "name")
      .populate({
        path: "teacher_id",
        populate: { path: "user_id", select: "name phoneOrEmail" }
      });
      
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { name, course_id, teacher_id, timing } = body;

    const batch = await Batch.create({
      name,
      course_id,
      teacher_id,
      timing,
      institute_id: authUser.institute_id
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
