import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Test from "@/models/Test";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import Batch from "@/models/Batch";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    const { searchParams } = new URL(req.url);
    const batch_id = searchParams.get("batch_id");

    const query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) return NextResponse.json([], { status: 200 });

      const batches = await Batch.find({ teacher_id: teacher._id }).select("_id");
      const batchIds = batches.map(b => b._id.toString());
      
      if (batch_id && !batchIds.includes(batch_id)) {
        return NextResponse.json({ error: "Forbidden: Not your batch" }, { status: 403 });
      }
      query.batch_id = batch_id ? batch_id : { $in: batchIds };
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne({ user_id: authUser._id });
      if (!student) return NextResponse.json([], { status: 200 });
      // student can only see tests from their batch
      query.batch_id = student.batch_id;
    } else {
      // ADMIN
      if (batch_id) query.batch_id = batch_id;
    }

    const tests = await Test.find(query).populate("batch_id");
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);

    const body = await req.json();
    const { name, batch_id, date, total_marks } = body;

    // Security: Enforce Teacher batch ownership
    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) throw new Error("Teacher profile not found");
      const batch = await Batch.findOne({ _id: batch_id, teacher_id: teacher._id, institute_id: authUser.institute_id });
      if (!batch) {
        return NextResponse.json({ error: "Forbidden: Not your batch" }, { status: 403 });
      }
    }

    const testItem = await Test.create({
      name,
      batch_id,
      date,
      total_marks,
      institute_id: authUser.institute_id
    });

    return NextResponse.json(testItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
