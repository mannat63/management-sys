import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser, requireRole } from "@/lib/auth";
import Student from "@/models/Student";
import User from "@/models/User";
import Teacher from "@/models/Teacher";
import Batch from "@/models/Batch";
import Fee from "@/models/Fee";

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
      query.user_id = authUser._id;
    } else {
      // ADMIN
      if (batch_id) query.batch_id = batch_id;
    }

    const students = await Student.find(query)
      .populate("user_id", "name phoneOrEmail")
      .populate("batch_id", "name")
      .lean(); // Use lean for mapping custom keys
      
    const studentIds = students.map(s => s._id);
    const fees = await Fee.find({ student_id: { $in: studentIds } }).lean();
    
    // Map them exactly
    const feeMap = {};
    fees.forEach(f => {
      feeMap[f.student_id.toString()] = f.total_amount;
    });

    const studentsWithFees = students.map(s => ({
       ...s,
       total_fee: feeMap[s._id.toString()] || 0
    }));

    return NextResponse.json(studentsWithFees);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const authUser = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { name, phoneOrEmail, batch_id, parent_name, parent_phone, admission_date, total_fee, due_date } = body;

    // 1. Create User
    const user = await User.create({
      name,
      phoneOrEmail,
      role: "STUDENT",
      institute_id: authUser.institute_id
    });

    // 2. Create Student profile
    const student = await Student.create({
      user_id: user._id,
      batch_id,
      parent_name,
      parent_phone,
      admission_date: admission_date ? new Date(admission_date) : new Date(),
      institute_id: authUser.institute_id
    });

    // 3. Create initial Fee if provided
    if (total_fee !== undefined && total_fee !== "") {
      await Fee.create({
        student_id: student._id,
        total_amount: Number(total_fee) || 0,
        due_amount: Number(total_fee) || 0,
        paid_amount: 0,
        due_date: due_date ? new Date(due_date) : new Date(),
        status: "DUE",
        institute_id: authUser.institute_id
      });
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
