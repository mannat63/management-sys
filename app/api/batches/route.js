import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Batch from "@/models/Batch";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import Course from "@/models/Course";
import User from "@/models/User";
import Institute from "@/models/Institute";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.institute_id) {
      console.error("Batches GET: Unauthorized or missing institute_id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!teacher) return NextResponse.json([], { status: 200 });
      query.teacher_id = teacher._id;
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne(
        { user_id: authUser._id },
        { _id: 1, batch_id: 1 }
      ).lean();
      if (!student) return NextResponse.json([], { status: 200 });
      query._id = student.batch_id;
    }

    const batches = await Batch.find(query)
      .select("name timing course_id teacher_id")
      .populate("course_id", "name")
      .populate({
        path: "teacher_id",
        select: "user_id",
        populate: { path: "user_id", select: "name phoneOrEmail" },
      })
      .lean();

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Batches GET error:", error);
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
      institute_id: authUser.institute_id,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Batches POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
