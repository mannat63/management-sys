import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import Batch from "@/models/Batch";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await req.json();
    const { name, course_id, teacher_id, timing } = body;

    const batch = await Batch.findOneAndUpdate(
      { _id: id, institute_id: authUser.institute_id },
      { name, course_id, teacher_id, timing },
      { new: true }
    )
      .populate("course_id", "name")
      .populate({ path: "teacher_id", populate: { path: "user_id", select: "name phoneOrEmail" } });

    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);
    const { id } = await params;
    
    // Check for relational integrity
    const { default: Student } = await import("@/models/Student");
    const studentCount = await Student.countDocuments({ batch_id: id, institute_id: authUser.institute_id });
    if (studentCount > 0) {
      return NextResponse.json({ error: "Cannot delete batch with active students" }, { status: 400 });
    }

    const batch = await Batch.findOneAndDelete({ _id: id, institute_id: authUser.institute_id });
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    
    // Cleanup related data like Attendance and Tests (Results cascade deleted if we delete Tests)
    const { default: Attendance } = await import("@/models/Attendance");
    const { default: Test } = await import("@/models/Test");
    const { default: Result } = await import("@/models/Result");

    await Attendance.deleteMany({ batch_id: id });
    const tests = await Test.find({ batch_id: id }, { _id: 1 });
    const testIds = tests.map(t => t._id);
    await Result.deleteMany({ test_id: { $in: testIds } });
    await Test.deleteMany({ batch_id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
