import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Result from "@/models/Result";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Test from "@/models/Test";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();

    const { searchParams } = new URL(req.url);
    const test_id = searchParams.get("test_id");

    const query = { institute_id: authUser.institute_id };

    if (authUser.role === "TEACHER") {
      const [teacher] = await Promise.all([
        Teacher.findOne({ user_id: authUser._id }, { _id: 1 }).lean(),
      ]);
      if (!teacher) return NextResponse.json([], { status: 200 });

      const batches = await Batch.find(
        { teacher_id: teacher._id },
        { _id: 1 }
      ).lean();
      const batchIds = batches.map((b) => b._id);

      const tests = await Test.find(
        { batch_id: { $in: batchIds } },
        { _id: 1 }
      ).lean();
      const testIds = tests.map((t) => t._id.toString());

      if (test_id && !testIds.includes(test_id)) {
        return NextResponse.json(
          { error: "Forbidden: Not your test" },
          { status: 403 }
        );
      }
      query.test_id = test_id ? test_id : { $in: testIds };
    } else if (authUser.role === "STUDENT") {
      const student = await Student.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!student) return NextResponse.json([], { status: 200 });
      query.student_id = student._id;
      if (test_id) query.test_id = test_id;
    } else {
      if (test_id) query.test_id = test_id;
    }

    // Project only what UI needs; use lean() for plain objects
    const results = await Result.find(query)
      .select("test_id student_id subject_marks")
      .populate("test_id", "name date subjects batch_id")
      .populate("student_id", "user_id parent_name")
      .lean();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Results GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN", "TEACHER"]);

    const body = await req.json();
    const { test_id, student_id, subject_marks } = body;

    if (authUser.role === "TEACHER") {
      const teacher = await Teacher.findOne(
        { user_id: authUser._id },
        { _id: 1 }
      ).lean();
      if (!teacher) throw new Error("Teacher profile not found");

      const test = await Test.findById(test_id, { batch_id: 1 }).lean();
      if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

      const batch = await Batch.findOne(
        { _id: test.batch_id, teacher_id: teacher._id, institute_id: authUser.institute_id },
        { _id: 1 }
      ).lean();
      if (!batch) {
        return NextResponse.json(
          { error: "Forbidden: Not your batch's test" },
          { status: 403 }
        );
      }
    }

    const result = await Result.findOneAndUpdate(
      { test_id, student_id, institute_id: authUser.institute_id },
      { subject_marks },
      { new: true, upsert: true }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Results POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
