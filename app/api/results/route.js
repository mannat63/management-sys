import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Result from "@/models/Result";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Test from "@/models/Test";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    const { searchParams } = new URL(req.url);
    const test_id = searchParams.get("test_id");

    const query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) return NextResponse.json([], { status: 200 });
      
      const batches = await Batch.find({ teacher_id: teacher._id }).select("_id");
      const batchIds = batches.map(b => b._id.toString());
      
      const tests = await Test.find({ batch_id: { $in: batchIds } }).select("_id");
      const testIds = tests.map(t => t._id.toString());

      if (test_id && !testIds.includes(test_id)) {
        return NextResponse.json({ error: "Forbidden: Not your test" }, { status: 403 });
      }
      query.test_id = test_id ? test_id : { $in: testIds };
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne({ user_id: authUser._id });
      if (!student) return NextResponse.json([], { status: 200 });
      query.student_id = student._id;
      if (test_id) query.test_id = test_id;
    } else {
      // ADMIN
      if (test_id) query.test_id = test_id;
    }

    const results = await Result.find(query).populate("test_id").populate("student_id");
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);

    const body = await req.json();
    const { test_id, student_id, marks } = body;

    // Security: Enforce Teacher batch ownership for the test
    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne({ user_id: authUser._id });
      if (!teacher) throw new Error("Teacher profile not found");
      
      const test = await Test.findById(test_id);
      if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
      
      const batch = await Batch.findOne({ _id: test.batch_id, teacher_id: teacher._id, institute_id: authUser.institute_id });
      if (!batch) {
        return NextResponse.json({ error: "Forbidden: Not your batch's test" }, { status: 403 });
      }
    }

    // Try finding an existing result and update (upsert), instead of always creating to avoid duplicates
    const result = await Result.findOneAndUpdate(
      { test_id, student_id, institute_id: authUser.institute_id },
      { marks },
      { new: true, upsert: true }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
